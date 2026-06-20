import base64
import json
import re
from typing import Any

from django.conf import settings as django_settings
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from core.env_keys import get_gemini_api_key
from core.llm_common import DEFAULT_LLM_PROMPT, MARKDOWN_IMAGE_RE, build_agent_response
from core.tools.registry import registry


def _friendly_gemini_error(exc: genai_errors.APIError) -> str:
    message = str(exc)
    lower = message.lower()
    if "resource_exhausted" in lower or "429" in message:
        return (
            "Gemini quota exceeded for this model. Try gemini-2.5-flash in Settings, "
            "or check billing at https://aistudio.google.com"
        )
    if "quota" in lower:
        return (
            "Gemini API quota exceeded. Check usage at "
            "https://aistudio.google.com or try again later."
        )
    if "503" in message or "unavailable" in lower:
        return (
            "Gemini is temporarily busy (503). Wait a few seconds and retry, "
            "or switch to gemini-2.5-flash."
        )
    if (
        "401" in message
        or "403" in message
        or "api_key_invalid" in lower
        or ("api key" in lower and "invalid" in lower)
    ):
        return (
            "Invalid Gemini API key. Clear the key in Settings (use server .env) "
            "or set GEMINI_API_KEY in .env — https://aistudio.google.com/apikey"
        )
    if "404" in message and "model" in lower:
        return (
            "Invalid Gemini model name. Use a model like gemini-2.5-flash "
            "(not gpt-4o-mini)."
        )
    return message


def _resolve_gemini_model(model: str | None) -> str:
    name = (model or django_settings.GEMINI_MODEL or "gemini-2.5-flash").strip()
    if name.startswith("gemini-"):
        return name
    return django_settings.GEMINI_MODEL or "gemini-2.5-flash"


def _get_client(api_key: str | None = None) -> genai.Client:
    key = get_gemini_api_key(api_key)
    if not key:
        raise ValueError(
            "Gemini API key is not set. Add GEMINI_API_KEY to .env "
            "(get a key at https://aistudio.google.com/apikey)."
        )
    return genai.Client(api_key=key)


def _content_to_parts(text: str) -> list[types.Part]:
    parts: list[types.Part] = []
    image_urls = [match.group(2) for match in MARKDOWN_IMAGE_RE.finditer(text)]
    plain_text = MARKDOWN_IMAGE_RE.sub("", text).strip()

    if plain_text:
        parts.append(types.Part.from_text(text=plain_text))

    for url in image_urls:
        match = re.match(r"data:image/([^;]+);base64,(.+)", url)
        if not match:
            continue
        mime = f"image/{match.group(1)}"
        data = base64.b64decode(match.group(2))
        parts.append(types.Part.from_bytes(data=data, mime_type=mime))

    return parts


def _messages_to_contents(messages: list[dict[str, Any]]) -> list[types.Content]:
    contents: list[types.Content] = []
    for msg in messages:
        role = msg.get("role", "user")
        if role == "system":
            continue
        text = msg.get("content", "")
        if not text:
            continue
        gemini_role = "user" if role == "user" else "model"
        parts = _content_to_parts(text) if isinstance(text, str) else [types.Part.from_text(text=str(text))]
        if not parts:
            continue
        contents.append(
            types.Content(
                role=gemini_role,
                parts=parts,
            )
        )
    return contents


def _build_gemini_tools(tool_ids: list[str] | None = None) -> list[types.Tool] | None:
    declarations = registry.get_function_declarations(tool_ids)
    if not declarations:
        return None
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name=d["name"],
                    description=d["description"],
                    parameters=d["parameters"],
                )
                for d in declarations
            ]
        )
    ]


def _extract_text(parts: list[types.Part]) -> str:
    chunks: list[str] = []
    for part in parts:
        if part.text:
            chunks.append(part.text)
    return "".join(chunks).strip()


def _parse_function_args(raw: Any) -> dict[str, Any]:
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {"value": parsed}
        except json.JSONDecodeError:
            return {"raw": raw}
    return {"value": raw}


def _result_to_response_payload(result: str) -> dict[str, Any]:
    try:
        parsed = json.loads(result)
        if isinstance(parsed, dict):
            return parsed
        return {"result": parsed}
    except json.JSONDecodeError:
        return {"result": result}


def run_gemini_agent(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
    agent_id: str | None = None,
    agent_name: str | None = None,
) -> dict[str, Any]:
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

    for round_idx in range(django_settings.MAX_TOOL_ROUNDS):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
        except genai_errors.APIError as e:
            raise ValueError(_friendly_gemini_error(e)) from e

        if not response.candidates:
            raise ValueError("Gemini returned no response candidates")

        candidate = response.candidates[0]
        model_content = candidate.content
        if not model_content or not model_content.parts:
            raise ValueError("Gemini returned empty content")

        parts = model_content.parts
        function_calls = [p for p in parts if p.function_call]

        if not function_calls:
            return build_agent_response(
                message=_extract_text(parts),
                tool_trace=tool_trace,
                provider="gemini",
                model=model_name,
                agent_id=agent_id,
                agent_name=agent_name,
            )

        contents.append(model_content)
        response_parts: list[types.Part] = []

        for call_idx, part in enumerate(function_calls):
            fc = part.function_call
            if not fc or not fc.name:
                continue

            fn_name = fc.name
            args = _parse_function_args(fc.args)
            call_id = f"gemini-{round_idx}-{call_idx}-{fn_name}"

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

            response_parts.append(
                types.Part.from_function_response(
                    name=fn_name,
                    response=_result_to_response_payload(result),
                )
            )

        contents.append(types.Content(role="user", parts=response_parts))

    return build_agent_response(
        message="Reached maximum tool rounds. Please try a simpler request.",
        tool_trace=tool_trace,
        provider="gemini",
        model=model_name,
        agent_id=agent_id,
        agent_name=agent_name,
    )
