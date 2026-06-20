import json
from typing import Any

import httpx
from django.conf import settings as django_settings

from core.env_keys import get_huggingface_api_key
from core.llm_common import DEFAULT_LLM_PROMPT, build_agent_response, prepare_user_content_for_api
from core.tools.registry import registry

HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions"


def _friendly_huggingface_error(status: int, body: str) -> str:
    lower = body.lower()
    if status == 401 or "invalid" in lower or "token" in lower:
        return (
            "Invalid Hugging Face API Token. Set HUGGINGFACE_API_KEY or HF_TOKEN in .env — "
            "https://huggingface.co/settings/tokens"
        )
    if status == 503 or "loading" in lower:
        try:
            data = json.loads(body)
            msg = data.get("error", "Model is currently loading on Hugging Face.")
            estimated_time = data.get("estimated_time", 20)
            return f"{msg} (Estimated time: {estimated_time}s). Please wait and try again."
        except Exception:
            return "Model is currently loading on Hugging Face. Please try again in a moment."
    try:
        data = json.loads(body)
        err = data.get("error")
        if isinstance(err, str):
            return err
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])
    except json.JSONDecodeError:
        pass
    return body or f"Hugging Face API error ({status})"


def _resolve_huggingface_model(model: str | None) -> str:
    name = (model or django_settings.HUGGINGFACE_MODEL or "Qwen/Qwen2.5-Coder-32B-Instruct").strip()
    if name:
        return name
    return "Qwen/Qwen2.5-Coder-32B-Instruct"


def _get_api_key(api_key: str | None = None) -> str:
    key = get_huggingface_api_key(api_key)
    if not key:
        raise ValueError(
            "Hugging Face API Token is not set. Add HUGGINGFACE_API_KEY to .env "
            "(get a token at https://huggingface.co/settings/tokens), then restart the backend."
        )
    return key


def _build_openai_tools(tool_ids: list[str] | None = None) -> list[dict[str, Any]] | None:
    declarations = registry.get_function_declarations(tool_ids)
    if not declarations:
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
        for d in declarations
    ]


def _to_openai_messages(
    messages: list[dict[str, Any]],
    system_prompt: str,
    model: str | None = None,
) -> list[dict[str, Any]]:
    model_name = _resolve_huggingface_model(model)
    result: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.get("role", "user")
        if role == "system":
            continue
        content = msg.get("content", "")
        if role in ("user", "assistant", "tool") and content is not None:
            parsed_content = (
                prepare_user_content_for_api(content, provider="huggingface", model=model_name)
                if role == "user" and isinstance(content, str)
                else content
            )
            entry: dict[str, Any] = {"role": role, "content": parsed_content}
            if role == "tool" and msg.get("tool_call_id"):
                entry["tool_call_id"] = msg["tool_call_id"]
            if role == "assistant" and msg.get("tool_calls"):
                entry["tool_calls"] = msg["tool_calls"]
                entry["content"] = content or None
            result.append(entry)
    return result


def run_huggingface_agent(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
    agent_id: str | None = None,
    agent_name: str | None = None,
) -> dict[str, Any]:
    key = _get_api_key(api_key)
    model_name = _resolve_huggingface_model(model)
    prompt = (system_prompt or "").strip() or DEFAULT_LLM_PROMPT
    tools = _build_openai_tools(tool_ids)

    openai_messages = _to_openai_messages(messages, prompt, model_name)
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
                HUGGINGFACE_API_URL,
                headers=headers,
                json=body,
                timeout=120.0,
            )
        except httpx.RequestError as e:
            raise ValueError(f"Could not reach Hugging Face API: {e}") from e

        if resp.status_code >= 400:
            err_text = resp.text
            if "tool_use_failed" in err_text and tools:
                body_no_tools = {k: v for k, v in body.items() if k not in ("tools", "tool_choice")}
                resp = httpx.post(
                    HUGGINGFACE_API_URL,
                    headers=headers,
                    json=body_no_tools,
                    timeout=120.0,
                )
            if resp.status_code >= 400:
                raise ValueError(_friendly_huggingface_error(resp.status_code, resp.text))

        data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            if "error" in data:
                raise ValueError(_friendly_huggingface_error(resp.status_code, resp.text))
            raise ValueError("Hugging Face returned no choices")

        assistant_message = choices[0].get("message") or {}
        tool_calls = assistant_message.get("tool_calls") or []

        if not tool_calls:
            return build_agent_response(
                message=(assistant_message.get("content") or "").strip(),
                tool_trace=tool_trace,
                provider="huggingface",
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

            call_id = tc.get("id") or f"hf-{round_idx}-{call_idx}-{fn_name}"

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
        provider="huggingface",
        model=model_name,
        agent_id=agent_id,
        agent_name=agent_name,
    )
