import re
from typing import Any

MARKDOWN_IMAGE_RE = re.compile(r"!\[[^\]]*\]\((data:image/[^;]+;base64,[^)]+)\)")

DEFAULT_LLM_PROMPT = """You are a helpful agentic AI assistant.
You have access to tools. When a user asks for calculations, dates, or structured data,
use the appropriate tools. Always explain your reasoning briefly after using tools.
If no tool is needed, respond directly."""


def parse_multimodal_content(content: str) -> str | list[dict[str, Any]]:
    """Extract embedded markdown data-URL images for vision-capable providers."""
    if not content or "data:image/" not in content:
        return content

    image_urls = MARKDOWN_IMAGE_RE.findall(content)
    if not image_urls:
        return content

    text = MARKDOWN_IMAGE_RE.sub("", content).strip()
    parts: list[dict[str, Any]] = []
    if text:
        parts.append({"type": "text", "text": text})
    for url in image_urls:
        parts.append({"type": "image_url", "image_url": {"url": url}})
    return parts


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
