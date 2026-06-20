import asyncio
import http.cookies
import json
import logging
import os
import sys
from typing import Any
from urllib.parse import parse_qs, urlparse

import django
import jwt
from asgiref.sync import sync_to_async
from websockets.server import serve

# Configure Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
from core.models import User
from core import agents as agent_service
from core.streaming_agent import run_agent_stream

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("websocket_server")


def get_token_from_path(path: str) -> str | None:
    try:
        parsed = urlparse(path)
        qs = parse_qs(parsed.query)
        tokens = qs.get("token")
        if tokens:
            return tokens[0]
    except Exception:
        pass
    return None


@sync_to_async
def get_user_by_id(user_id: int) -> User | None:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


@sync_to_async
def get_agent_cfg(user: User, agent_id: str | None) -> dict[str, Any]:
    return agent_service.get_agent_for_chat(user, agent_id)


async def authenticate_user(websocket, path: str) -> User | None:
    token = None

    # 1. Cookie
    cookie_header = websocket.request_headers.get("Cookie", "")
    if cookie_header:
        try:
            cookies = http.cookies.SimpleCookie(cookie_header)
            access_token_cookie = cookies.get("access_token")
            if access_token_cookie:
                token = access_token_cookie.value
        except Exception:
            pass

    # 2. Query param
    if not token:
        token = get_token_from_path(path)

    # 3. Auth header
    if not token:
        auth_header = websocket.request_headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await get_user_by_id(payload["user_id"])
        return user
    except Exception as e:
        logger.warning(f"WebSocket authentication failed: {e}")
        return None


def run_generator_in_thread(gen):
    def _next():
        try:
            return next(gen), False
        except StopIteration:
            return None, True
    return _next


async def handler(websocket, path=None):
    if path is None:
        path = getattr(websocket, "path", "/")

    logger.info(f"New connection from path: {path}")
    user = await authenticate_user(websocket, path)
    if not user:
        logger.warning("Unauthenticated connection rejected.")
        await websocket.send(
            json.dumps(
                {
                    "type": "error",
                    "code": "unauthorized",
                    "message": "Authentication failed or token expired.",
                }
            )
        )
        await websocket.close()
        return

    logger.info(f"User {user.username} authenticated successfully.")

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "chat":
                messages = data.get("messages", [])
                api_key = data.get("api_key")
                model = data.get("model")
                provider = data.get("provider")
                agent_id = data.get("agent_id")

                try:
                    agent_cfg = await get_agent_cfg(user, agent_id)
                    msgs = [{"role": m["role"], "content": m["content"]} for m in messages]

                    # Create streaming generator
                    gen = run_agent_stream(
                        messages=msgs,
                        api_key=api_key,
                        model=model,
                        system_prompt=agent_cfg.get("system_prompt"),
                        tool_ids=agent_cfg.get("tool_ids"),
                        provider=provider,
                    )

                    next_fn = run_generator_in_thread(gen)
                    while True:
                        chunk, is_done = await asyncio.to_thread(next_fn)
                        if is_done:
                            break

                        if chunk.get("type") == "done":
                            if agent_cfg.get("id"):
                                chunk["agent_id"] = agent_cfg["id"]
                            if agent_cfg.get("name"):
                                chunk["agent_name"] = agent_cfg["name"]

                        await websocket.send(json.dumps(chunk))

                except Exception as e:
                    logger.error(f"Agent stream error: {e}", exc_info=True)
                    await websocket.send(
                        json.dumps({"type": "error", "message": str(e)})
                    )
    except Exception as e:
        logger.error(f"Error handling connection for {user.username}: {e}")
    finally:
        logger.info(f"Connection closed for {user.username}")


async def main():
    port = int(os.getenv("WEBSOCKET_PORT", "8001"))
    host = os.getenv("WEBSOCKET_HOST", "127.0.0.1")
    logger.info(f"Starting WebSocket server on ws://{host}:{port}")
    async with serve(handler, host, port):
        await asyncio.Future()  # keep running


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("WebSocket server stopped.")
