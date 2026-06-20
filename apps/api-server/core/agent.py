from typing import Any

from django.conf import settings as django_settings

from core.gemini_agent import run_gemini_agent
from core.groq_agent import run_groq_agent
from core.huggingface_agent import run_huggingface_agent


def run_agent(
    messages: list[dict[str, Any]],
    api_key: str | None = None,
    model: str | None = None,
    system_prompt: str | None = None,
    tool_ids: list[str] | None = None,
    agent_id: str | None = None,
    agent_name: str | None = None,
    provider: str | None = None,
) -> dict[str, Any]:
    kwargs = {
        "system_prompt": system_prompt,
        "tool_ids": tool_ids,
        "agent_id": agent_id,
        "agent_name": agent_name,
    }
    prov = (provider or django_settings.LLM_PROVIDER or "groq").strip().lower()
    if prov == "gemini":
        return run_gemini_agent(messages, api_key=api_key, model=model, **kwargs)
    elif prov == "huggingface":
        return run_huggingface_agent(messages, api_key=api_key, model=model, **kwargs)
    return run_groq_agent(messages, api_key=api_key, model=model, **kwargs)
