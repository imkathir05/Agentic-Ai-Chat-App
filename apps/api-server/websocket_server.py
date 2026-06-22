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
    if not path:
        return None
    try:
        parsed = urlparse(path if "?" in path else f"/?{path.lstrip('?')}")
        qs = parse_qs(parsed.query)
        tokens = qs.get("token")
        if tokens:
            return tokens[0]
    except Exception:
        pass
    return None


def _request_path(websocket, path: str | None) -> str:
    req = getattr(websocket, "request", None)
    if req is not None:
        for attr in ("path", "uri", "target"):
            value = getattr(req, attr, None)
            if value:
                return str(value)
    if path:
        return path
    return getattr(websocket, "path", "/") or "/"


def _request_headers(websocket) -> Any:
    req = getattr(websocket, "request", None)
    if req is not None and hasattr(req, "headers"):
        return req.headers
    return getattr(websocket, "request_headers", {})


@sync_to_async
def get_user_by_id(user_id: int) -> User | None:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


@sync_to_async
def get_agent_cfg(user: User, agent_id: str | None) -> dict[str, Any]:
    return agent_service.get_agent_for_chat(user, agent_id)


async def authenticate_token(token: str | None) -> User | None:
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await get_user_by_id(payload["user_id"])
        if user is None:
            logger.warning("WebSocket auth: user_id %s not found in database", payload.get("user_id"))
        return user
    except jwt.ExpiredSignatureError:
        logger.warning("WebSocket auth: token expired")
    except jwt.InvalidTokenError as e:
        logger.warning("WebSocket auth: invalid token (%s)", e.__class__.__name__)
    except Exception as e:
        logger.warning("WebSocket auth failed: %s", e)
    return None


async def authenticate_user(websocket, path: str | None) -> User | None:
    token = None
    headers = _request_headers(websocket)
    resolved_path = _request_path(websocket, path)

    cookie_header = headers.get("Cookie", "") if headers else ""
    if cookie_header:
        try:
            cookies = http.cookies.SimpleCookie(cookie_header)
            access_token_cookie = cookies.get("access_token")
            if access_token_cookie:
                token = access_token_cookie.value
        except Exception:
            pass

    if not token:
        token = get_token_from_path(resolved_path)

    if not token:
        auth_header = headers.get("Authorization", "") if headers else ""
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        logger.warning("WebSocket auth: no token (path=%r)", resolved_path)
        return None

    return await authenticate_token(token)


def run_generator_in_thread(gen):
    def _next():
        try:
            return next(gen), False
        except StopIteration:
            return None, True
    return _next


async def _reject_unauthenticated(websocket) -> None:
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


async def handler(websocket, path=None):
    logger.info("New connection from path: %r", _request_path(websocket, path))
    user = await authenticate_user(websocket, path)

    if not user:
        try:
            raw = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(raw)
            if data.get("type") == "auth":
                user = await authenticate_token(data.get("token"))
        except asyncio.TimeoutError:
            logger.warning("WebSocket auth: timed out waiting for auth message")
        except Exception as e:
            logger.warning("WebSocket auth message failed: %s", e)

    if not user:
        logger.warning("Unauthenticated connection rejected.")
        await _reject_unauthenticated(websocket)
        return

    logger.info("User %s authenticated successfully.", user.username)

    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "auth":
                continue

            if msg_type == "chat":
                messages = data.get("messages", [])
                api_key = data.get("api_key")
                model = data.get("model")
                provider = data.get("provider")
                agent_id = data.get("agent_id")

                try:
                    agent_cfg = await get_agent_cfg(user, agent_id)
                    msgs = [{"role": m["role"], "content": m["content"]} for m in messages]

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
                    logger.error("Agent stream error: %s", e, exc_info=True)
                    await websocket.send(
                        json.dumps({"type": "error", "message": str(e)})
                    )
    except Exception as e:
        logger.error("Error handling connection for %s: %s", user.username, e)
    finally:
        logger.info("Connection closed for %s", user.username)


async def main():
    port = int(os.getenv("WEBSOCKET_PORT") or os.getenv("PORT", "8001"))
    host = os.getenv("WEBSOCKET_HOST", "0.0.0.0" if os.getenv("PORT") else "127.0.0.1")
    logger.info("Starting WebSocket server on ws://%s:%s", host, port)
    async with serve(handler, host, port):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("WebSocket server stopped.")
