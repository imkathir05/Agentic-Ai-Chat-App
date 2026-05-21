from typing import Any

DEFAULT_LLM_PROMPT = """You are a helpful agentic AI assistant.
You have access to tools. When a user asks for calculations, dates, or structured data,
use the appropriate tools. Always explain your reasoning briefly after using tools.
If no tool is needed, respond directly."""


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
