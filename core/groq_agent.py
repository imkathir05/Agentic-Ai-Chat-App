import json
from typing import Any

import httpx
from django.conf import settings as django_settings

from core.env_keys import get_groq_api_key
from core.llm_common import DEFAULT_LLM_PROMPT, build_agent_response
from core.tools.registry import registry

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Groq's Llama models sometimes fail tool_use on the echo tool (invalid generation).
GROQ_SKIP_TOOLS = frozenset({"echo"})


def _friendly_groq_error(status: int, body: str) -> str:
    lower = body.lower()
    if status == 401 or "invalid_api_key" in lower:
        return (
            "Invalid Groq API key. Set GROQ_API_KEY in backend/.env — "
            "https://console.groq.com/keys"
        )
    if status == 429 or "rate" in lower:
        return "Groq rate limit exceeded. Wait a moment and try again."
    if status == 404 and "model" in lower:
        return (
            "Invalid Groq model. Try llama-3.3-70b-versatile or llama-3.1-8b-instant."
        )
    try:
        data = json.loads(body)
        err = data.get("error", {})
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])
    except json.JSONDecodeError:
        pass
    return body or f"Groq API error ({status})"


def _resolve_groq_model(model: str | None) -> str:
    name = (model or django_settings.GROQ_MODEL or "llama-3.3-70b-versatile").strip()
    if name:
        return name
    return "llama-3.3-70b-versatile"


def _get_api_key(api_key: str | None = None) -> str:
    key = get_groq_api_key(api_key)
    if not key:
        raise ValueError(
            "Groq API key is not set. Add GROQ_API_KEY to backend/.env "
            "(get a key at https://console.groq.com/keys), then restart the backend."
        )
    return key


def _build_openai_tools(tool_ids: list[str] | None = None) -> list[dict[str, Any]] | None:
    declarations = registry.get_function_declarations(tool_ids)
    filtered = [d for d in declarations if d["name"] not in GROQ_SKIP_TOOLS]
    if not filtered:
        return None
    return [
        {
            "type": "function",
            "function": {
                "name": d["name"],
                "description": d["description"],
                "parameters": d["parameters"],
            },
        }
        for d in filtered
    ]


def _to_openai_messages(
    messages: list[dict[str, Any]], system_prompt: str
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.get("role", "user")
        if role == "system":
            continue
        content = msg.get("content", "")
        if role in ("user", "assistant", "tool") and content is not None:
            entry: dict[str, Any] = {"role": role, "content": content}
            if role == "tool" and msg.get("tool_call_id"):
                entry["tool_call_id"] = msg["tool_call_id"]
            if role == "assistant" and msg.get("tool_calls"):
                entry["tool_calls"] = msg["tool_calls"]
                entry["content"] = content or None
            result.append(entry)
    return result


def run_groq_agent(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
    agent_id: str | None = None,
    agent_name: str | None = None,
) -> dict[str, Any]:
    key = _get_api_key(api_key)
    model_name = _resolve_groq_model(model)
    prompt = (system_prompt or "").strip() or DEFAULT_LLM_PROMPT
    tools = _build_openai_tools(tool_ids)

    openai_messages = _to_openai_messages(messages, prompt)
    if len(openai_messages) <= 1:
        raise ValueError("No messages to send")

    tool_trace: list[dict[str, Any]] = []

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    for round_idx in range(django_settings.MAX_TOOL_ROUNDS):
        body: dict[str, Any] = {
            "model": model_name,
            "messages": openai_messages,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"

        try:
            resp = httpx.post(
                GROQ_API_URL,
                headers=headers,
                json=body,
                timeout=120.0,
            )
        except httpx.RequestError as e:
            raise ValueError(f"Could not reach Groq API: {e}") from e

        if resp.status_code >= 400:
            err_text = resp.text
            if "tool_use_failed" in err_text and tools:
                body_no_tools = {k: v for k, v in body.items() if k not in ("tools", "tool_choice")}
                resp = httpx.post(
                    GROQ_API_URL,
                    headers=headers,
                    json=body_no_tools,
                    timeout=120.0,
                )
            if resp.status_code >= 400:
                raise ValueError(_friendly_groq_error(resp.status_code, resp.text))

        data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            raise ValueError("Groq returned no choices")

        assistant_message = choices[0].get("message") or {}
        tool_calls = assistant_message.get("tool_calls") or []

        if not tool_calls:
            return build_agent_response(
                message=(assistant_message.get("content") or "").strip(),
                tool_trace=tool_trace,
                provider="groq",
                model=model_name,
                agent_id=agent_id,
                agent_name=agent_name,
            )

        openai_messages.append(assistant_message)

        for call_idx, tc in enumerate(tool_calls):
            fn = tc.get("function") or {}
            fn_name = fn.get("name")
            if not fn_name:
                continue

            raw_args = fn.get("arguments") or "{}"
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                if not isinstance(args, dict):
                    args = {"value": args}
            except json.JSONDecodeError:
                args = {"raw": raw_args}

            call_id = tc.get("id") or f"groq-{round_idx}-{call_idx}-{fn_name}"

            try:
                result = registry.execute(fn_name, args)
                status = "success"
            except Exception as e:
                result = json.dumps({"error": str(e)})
                status = "error"

            tool_trace.append(
                {
                    "tool": fn_name,
                    "arguments": args,
                    "result": result,
                    "status": status,
                    "call_id": call_id,
                }
            )

            openai_messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call_id,
                    "content": result,
                }
            )

    return build_agent_response(
        message="Reached maximum tool rounds. Please try a simpler request.",
        tool_trace=tool_trace,
        provider="groq",
        model=model_name,
        agent_id=agent_id,
        agent_name=agent_name,
    )
