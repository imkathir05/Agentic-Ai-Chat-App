import re
from typing import Any

MARKDOWN_IMAGE_RE = re.compile(
    r"!\[([^\]]*)\]\((data:image/[^;]+;base64,[^)]+)\)"
)

GROQ_VISION_MODELS = frozenset({
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "llama-4-scout-17b-16e-instruct",
})

DEFAULT_LLM_PROMPT = """You are a helpful agentic AI assistant.
You have access to tools. When a user asks for calculations, dates, or structured data,
use the appropriate tools. Always explain your reasoning briefly after using tools.
If no tool is needed, respond directly."""


def has_embedded_images(content: str) -> bool:
    return bool(content and "data:image/" in content and MARKDOWN_IMAGE_RE.search(content))


def groq_model_supports_vision(model: str) -> bool:
    name = (model or "").strip().lower()
    return "vision" in name or name in GROQ_VISION_MODELS


def strip_embedded_images(content: str) -> str:
    """Replace embedded markdown images with short text placeholders."""
    text = MARKDOWN_IMAGE_RE.sub(
        lambda match: f"[Image attached: {match.group(1) or 'image'}]",
        content,
    ).strip()
    if has_embedded_images(content) and not text:
        return "[Image attached]"
    return text


def parse_multimodal_content(content: str) -> str | list[dict[str, Any]]:
    """Extract embedded markdown data-URL images for vision-capable providers."""
    if not has_embedded_images(content):
        return content

    image_urls = [match.group(2) for match in MARKDOWN_IMAGE_RE.finditer(content)]
    text = MARKDOWN_IMAGE_RE.sub("", content).strip()
    parts: list[dict[str, Any]] = []
    if text:
        parts.append({"type": "text", "text": text})
    for url in image_urls:
        parts.append({"type": "image_url", "image_url": {"url": url}})
    return parts


def prepare_user_content_for_api(
    content: str,
    *,
    provider: str,
    model: str,
) -> str | list[dict[str, Any]]:
    if not isinstance(content, str) or not has_embedded_images(content):
        return content

    supports_vision = provider == "gemini" or (
        provider == "groq" and groq_model_supports_vision(model)
    )
    if supports_vision:
        return parse_multimodal_content(content)

    text = strip_embedded_images(content)
    notice = (
        "[Note: The user attached an image, but the current model cannot view images. "
        "Let them know and suggest switching to a vision model such as "
        "gemini-2.5-flash or llama-3.2-11b-vision-preview.]"
    )
    return f"{notice}\n\n{text}" if text else notice


def build_agent_response(
    *,
    message: str,
    tool_trace: list[dict[str, Any]],
    provider: str,
    model: str,
    agent_id: str | None = None,
    agent_name: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "message": message,
        "tool_trace": tool_trace,
        "provider": provider,
        "model": model,
    }
    if agent_id:
        payload["agent_id"] = agent_id
    if agent_name:
        payload["agent_name"] = agent_name
    return payload
