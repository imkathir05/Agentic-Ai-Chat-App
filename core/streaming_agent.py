import json
import logging
from typing import Any, Generator
import httpx
from django.conf import settings as django_settings
from google.genai import types
from google.genai import errors as genai_errors

from core.gemini_agent import (
    _get_client,
    _resolve_gemini_model,
    _build_gemini_tools,
    _messages_to_contents,
    _extract_text,
    _parse_function_args,
    _result_to_response_payload,
    _friendly_gemini_error,
)
from core.groq_agent import (
    _get_api_key as _get_groq_api_key,
    _resolve_groq_model,
    _build_openai_tools,
    _to_openai_messages,
    _friendly_groq_error,
    GROQ_API_URL,
)
from core.llm_common import DEFAULT_LLM_PROMPT
from core.tools.registry import registry

logger = logging.getLogger(__name__)


def run_gemini_agent_stream(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
) -> Generator[dict[str, Any], None, None]:
    client = _get_client(api_key)
    model_name = _resolve_gemini_model(model)
    prompt = (system_prompt or "").strip() or DEFAULT_LLM_PROMPT
    gemini_tools = _build_gemini_tools(tool_ids)

    contents = _messages_to_contents(messages)
    if not contents:
        raise ValueError("No messages to send")

    config = types.GenerateContentConfig(
        system_instruction=prompt,
        tools=gemini_tools,
    )

    tool_trace: list[dict[str, Any]] = []

    yield {"type": "info", "provider": "gemini", "model": model_name}

    for round_idx in range(django_settings.MAX_TOOL_ROUNDS):
        try:
            response_stream = client.models.generate_content_stream(
                model=model_name,
                contents=contents,
                config=config,
            )
        except genai_errors.APIError as e:
            raise ValueError(_friendly_gemini_error(e)) from e

        accumulated_parts = []
        function_calls = []

        for chunk in response_stream:
            if not chunk.candidates:
                continue
            candidate = chunk.candidates[0]
            if not candidate.content or not candidate.content.parts:
                continue

            for part in candidate.content.parts:
                accumulated_parts.append(part)
                if part.function_call:
                    function_calls.append(part)
                elif part.text:
                    yield {"type": "content", "delta": part.text}

        if not accumulated_parts:
            raise ValueError("Gemini returned empty response")

        # Record model response
        model_content = types.Content(role="model", parts=accumulated_parts)

        if not function_calls:
            # We are done
            full_text = _extract_text(accumulated_parts)
            yield {
                "type": "done",
                "message": full_text,
                "tool_trace": tool_trace,
            }
            return

        contents.append(model_content)
        response_parts = []

        for call_idx, part in enumerate(function_calls):
            fc = part.function_call
            if not fc or not fc.name:
                continue

            fn_name = fc.name
            args = _parse_function_args(fc.args)
            call_id = f"gemini-{round_idx}-{call_idx}-{fn_name}"

            yield {
                "type": "tool_start",
                "tool": fn_name,
                "arguments": args,
                "call_id": call_id,
            }

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

            yield {
                "type": "tool_end",
                "tool": fn_name,
                "result": result,
                "status": status,
                "call_id": call_id,
            }

            response_parts.append(
                types.Part.from_function_response(
                    name=fn_name,
                    response=_result_to_response_payload(result),
                )
            )

        contents.append(types.Content(role="user", parts=response_parts))

    yield {
        "type": "done",
        "message": "Reached maximum tool rounds. Please try a simpler request.",
        "tool_trace": tool_trace,
    }


def run_groq_agent_stream(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
) -> Generator[dict[str, Any], None, None]:
    key = _get_groq_api_key(api_key)
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

    yield {"type": "info", "provider": "groq", "model": model_name}

    for round_idx in range(django_settings.MAX_TOOL_ROUNDS):
        body: dict[str, Any] = {
            "model": model_name,
            "messages": openai_messages,
            "stream": True,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"

        try:
            with httpx.Client() as http_client:
                with http_client.stream("POST", GROQ_API_URL, headers=headers, json=body, timeout=120.0) as r:
                    if r.status_code >= 400:
                        r.read()
                        if "tool_use_failed" in r.text and tools:
                            body_no_tools = {k: v for k, v in body.items() if k not in ("tools", "tool_choice")}
                            with http_client.stream("POST", GROQ_API_URL, headers=headers, json=body_no_tools, timeout=120.0) as r2:
                                if r2.status_code >= 400:
                                    r2.read()
                                    raise ValueError(_friendly_groq_error(r2.status_code, r2.text))
                                r = r2
                        else:
                            raise ValueError(_friendly_groq_error(r.status_code, r.text))

                    accumulated_content = ""
                    accumulated_tool_calls = {}

                    for line in r.iter_lines():
                        if not line.strip():
                            continue
                        if line.startswith("data: "):
                            data_str = line[len("data: "):].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                            except json.JSONDecodeError:
                                continue

                            choices = chunk.get("choices", [])
                            if not choices:
                                continue
                            choice = choices[0]
                            delta = choice.get("delta", {})

                            if "content" in delta and delta["content"]:
                                content_chunk = delta["content"]
                                accumulated_content += content_chunk
                                yield {"type": "content", "delta": content_chunk}

                            if "tool_calls" in delta:
                                for tc_delta in delta["tool_calls"]:
                                    idx = tc_delta.get("index", 0)
                                    if idx not in accumulated_tool_calls:
                                        accumulated_tool_calls[idx] = {
                                            "id": tc_delta.get("id"),
                                            "type": "function",
                                            "function": {
                                                "name": tc_delta.get("function", {}).get("name", ""),
                                                "arguments": tc_delta.get("function", {}).get("arguments", "")
                                            }
                                        }
                                    else:
                                        if "id" in tc_delta and tc_delta["id"]:
                                            accumulated_tool_calls[idx]["id"] = tc_delta["id"]
                                        fn_delta = tc_delta.get("function", {})
                                        if "name" in fn_delta and fn_delta["name"]:
                                            accumulated_tool_calls[idx]["function"]["name"] += fn_delta["name"]
                                        if "arguments" in fn_delta and fn_delta["arguments"]:
                                            accumulated_tool_calls[idx]["function"]["arguments"] += fn_delta["arguments"]
        except httpx.RequestError as e:
            raise ValueError(f"Could not reach Groq API: {e}") from e

        if accumulated_tool_calls:
            tool_calls_list = []
            for idx in sorted(accumulated_tool_calls.keys()):
                tool_calls_list.append(accumulated_tool_calls[idx])

            assistant_msg = {
                "role": "assistant",
                "content": accumulated_content or None,
                "tool_calls": tool_calls_list
            }
            openai_messages.append(assistant_msg)

            for tc in tool_calls_list:
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

                call_id = tc.get("id") or f"groq-{round_idx}-{fn_name}"

                yield {
                    "type": "tool_start",
                    "tool": fn_name,
                    "arguments": args,
                    "call_id": call_id,
                }

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

                yield {
                    "type": "tool_end",
                    "tool": fn_name,
                    "result": result,
                    "status": status,
                    "call_id": call_id,
                }

                openai_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call_id,
                        "content": result,
                    }
                )
        else:
            yield {
                "type": "done",
                "message": accumulated_content,
                "tool_trace": tool_trace,
            }
            return

    yield {
        "type": "done",
        "message": "Reached maximum tool rounds. Please try a simpler request.",
        "tool_trace": tool_trace,
    }


def run_agent_stream(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
) -> Generator[dict[str, Any], None, None]:
    provider = (django_settings.LLM_PROVIDER or "groq").strip().lower()
    if provider == "gemini":
        yield from run_gemini_agent_stream(
            messages,
            api_key=api_key,
            model=model,
            system_prompt=system_prompt,
            tool_ids=tool_ids,
        )
    else:
        yield from run_groq_agent_stream(
            messages,
            api_key=api_key,
            model=model,
            system_prompt=system_prompt,
            tool_ids=tool_ids,
        )
