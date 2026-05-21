import uuid
from typing import Any

from django.db import transaction

from core.models import Agent, AgentTool, User

DEFAULT_SYSTEM_PROMPT = """You are a helpful agentic AI assistant.
You have access to a specific set of tools assigned to you. Use only those tools when needed.
Always explain your reasoning briefly after using tools. If no tool is needed, respond directly."""


def _agent_to_dict(agent: Agent) -> dict[str, Any]:
    tool_ids = list(agent.tools.values_list("id", flat=True))
    return {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "system_prompt": agent.system_prompt,
        "tool_ids": tool_ids,
        "tools_count": len(tool_ids),
        "created_at": agent.created_at.isoformat(),
        "updated_at": agent.updated_at.isoformat(),
    }


def list_agents(user: User) -> list[dict[str, Any]]:
    ensure_default_agent(user)
    return [_agent_to_dict(a) for a in Agent.objects.filter(user=user).prefetch_related("tools")]


def get_agent(user: User, agent_id: str) -> dict[str, Any] | None:
    try:
        agent = Agent.objects.prefetch_related("tools").get(pk=agent_id, user=user)
    except Agent.DoesNotExist:
        return None
    return _agent_to_dict(agent)


def get_agent_for_chat(user: User, agent_id: str | None) -> dict[str, Any]:
    if agent_id:
        agent = get_agent(user, agent_id)
        if not agent:
            raise ValueError("Agent not found")
        return agent

    ensure_default_agent(user)
    default = Agent.objects.filter(user=user).order_by("created_at").first()
    if not default:
        raise ValueError("No agent configured")
    return _agent_to_dict(default)


def create_agent(user: User, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "")).strip()
    if not name:
        raise ValueError("Agent name is required")

    agent = Agent.objects.create(
        id=payload.get("id") or str(uuid.uuid4())[:12],
        user=user,
        name=name,
        description=str(payload.get("description", "")).strip(),
        system_prompt=str(payload.get("system_prompt", "")).strip() or DEFAULT_SYSTEM_PROMPT,
    )
    tool_ids = payload.get("tool_ids") or []
    if tool_ids:
        set_agent_tools(user, agent.id, tool_ids)
    agent.refresh_from_db()
    return _agent_to_dict(Agent.objects.prefetch_related("tools").get(pk=agent.id))


def update_agent(user: User, agent_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    try:
        agent = Agent.objects.get(pk=agent_id, user=user)
    except Agent.DoesNotExist:
        raise KeyError(f"Agent '{agent_id}' not found")

    if "name" in updates:
        name = str(updates["name"]).strip()
        if not name:
            raise ValueError("Agent name cannot be empty")
        agent.name = name
    if "description" in updates:
        agent.description = str(updates["description"]).strip()
    if "system_prompt" in updates:
        prompt = str(updates["system_prompt"]).strip()
        agent.system_prompt = prompt or DEFAULT_SYSTEM_PROMPT
    agent.save()

    if "tool_ids" in updates:
        set_agent_tools(user, agent_id, updates["tool_ids"] or [])

    return _agent_to_dict(Agent.objects.prefetch_related("tools").get(pk=agent.id))


def delete_agent(user: User, agent_id: str) -> None:
    count = Agent.objects.filter(user=user).count()
    if count <= 1:
        raise ValueError("Cannot delete your only agent")
    try:
        agent = Agent.objects.get(pk=agent_id, user=user)
    except Agent.DoesNotExist:
        raise KeyError(f"Agent '{agent_id}' not found")
    agent.delete()


@transaction.atomic
def set_agent_tools(user: User, agent_id: str, tool_ids: list[str]) -> dict[str, Any]:
    try:
        agent = Agent.objects.get(pk=agent_id, user=user)
    except Agent.DoesNotExist:
        raise KeyError(f"Agent '{agent_id}' not found")

    valid_ids = set(
        AgentTool.objects.filter(id__in=tool_ids, enabled=True).values_list("id", flat=True)
    )
    unknown = [tid for tid in tool_ids if tid not in valid_ids]
    if unknown:
        raise ValueError(f"Unknown or disabled tool ids: {', '.join(unknown)}")

    agent.tools.set(AgentTool.objects.filter(id__in=valid_ids))
    return _agent_to_dict(Agent.objects.prefetch_related("tools").get(pk=agent.id))


def ensure_default_agent(user: User) -> Agent:
    existing = Agent.objects.filter(user=user).first()
    if existing:
        return existing

    agent = Agent.objects.create(
        user=user,
        name="General Assistant",
        description="Default agent with access to all enabled tools.",
        system_prompt=DEFAULT_SYSTEM_PROMPT,
    )
    enabled_tools = AgentTool.objects.filter(enabled=True)
    agent.tools.set(enabled_tools)
    return agent
