import json
import uuid
from typing import Any

from core.models import AgentTool, HandlerType
from core.tools.builtin import execute_builtin
from core.tools.http_api import execute_http_api

_UPDATABLE_FIELDS = (
    "name",
    "description",
    "parameters",
    "enabled",
    "handler_type",
    "api_url",
    "api_method",
    "api_headers",
    "api_body",
    "api_timeout",
)


class ToolRegistry:
    """Database-backed tool registry."""

    def list_tools(self) -> list[dict[str, Any]]:
        return [self._to_dict(t) for t in AgentTool.objects.all()]

    def get_tool(self, tool_id: str) -> dict[str, Any] | None:
        try:
            return self._to_dict(AgentTool.objects.get(pk=tool_id))
        except AgentTool.DoesNotExist:
            return None

    def set_tool(self, tool_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        try:
            tool = AgentTool.objects.get(pk=tool_id)
        except AgentTool.DoesNotExist:
            raise KeyError(f"Tool '{tool_id}' not found")

        if tool.is_builtin:
            updates = {k: v for k, v in updates.items() if k in ("description", "enabled")}

        if "name" in updates:
            new_name = str(updates["name"]).strip()
            if not new_name:
                raise ValueError("Tool name cannot be empty")
            if (
                new_name != tool.name
                and AgentTool.objects.filter(name=new_name).exists()
            ):
                raise ValueError(f"Tool name '{new_name}' already exists")
            updates["name"] = new_name

        handler_type = updates.get("handler_type", tool.handler_type)
        api_url = updates.get("api_url", tool.api_url)
        if handler_type == HandlerType.HTTP_API and not str(api_url or "").strip():
            raise ValueError("api_url is required for http_api tools")

        for key in _UPDATABLE_FIELDS:
            if key in updates:
                setattr(tool, key, updates[key])
        tool.save()
        return self._to_dict(tool)

    def add_custom_tool(self, payload: dict[str, Any]) -> dict[str, Any]:
        name = payload["name"].strip()
        if AgentTool.objects.filter(name=name).exists():
            raise ValueError(f"Tool name '{name}' already exists")

        handler_type = payload.get("handler_type", HandlerType.ECHO_ARGS)
        if handler_type == HandlerType.HTTP_API and not payload.get("api_url"):
            raise ValueError("api_url is required for http_api tools")

        tool = AgentTool(
            id=payload.get("id") or str(uuid.uuid4())[:12],
            name=name,
            description=payload["description"].strip(),
            parameters=payload.get(
                "parameters",
                {"type": "object", "properties": {}, "required": []},
            ),
            handler_type=handler_type,
            enabled=payload.get("enabled", True),
            is_builtin=False,
            api_url=payload.get("api_url", ""),
            api_method=payload.get("api_method", "GET"),
            api_headers=payload.get("api_headers") or {},
            api_body=payload.get("api_body", ""),
            api_timeout=float(payload.get("api_timeout") or 15),
        )
        tool.save()
        return self._to_dict(tool)

    def delete_tool(self, tool_id: str) -> None:
        try:
            tool = AgentTool.objects.get(pk=tool_id)
        except AgentTool.DoesNotExist:
            raise KeyError(f"Tool '{tool_id}' not found")
        if tool.is_builtin:
            raise ValueError("Cannot delete builtin tools; disable them instead")
        tool.delete()

    def get_function_declarations(
        self, tool_ids: list[str] | None = None
    ) -> list[dict[str, Any]]:
        qs = AgentTool.objects.filter(enabled=True)
        if tool_ids is not None:
            qs = qs.filter(id__in=tool_ids)
        result = []
        for tool in qs:
            result.append(
                {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                }
            )
        return result

    def execute(self, name: str, arguments: dict[str, Any]) -> str:
        try:
            tool = AgentTool.objects.get(name=name)
        except AgentTool.DoesNotExist:
            raise ValueError(f"Tool '{name}' not found")
        if not tool.enabled:
            raise ValueError(f"Tool '{name}' is disabled")

        if tool.handler_type == HandlerType.BUILTIN:
            return execute_builtin(name, arguments)

        if tool.handler_type == HandlerType.HTTP_API:
            return execute_http_api(self._to_dict(tool), arguments)

        if tool.handler_type == HandlerType.ECHO_ARGS:
            return json.dumps({"tool": name, "received": arguments})

        if tool.handler_type == HandlerType.UPPERCASE:
            text = arguments.get("text", "")
            return json.dumps({"result": str(text).upper()})

        raise ValueError(f"Unknown handler: {tool.handler_type}")

    @staticmethod
    def _to_dict(tool: AgentTool) -> dict[str, Any]:
        data: dict[str, Any] = {
            "id": tool.id,
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.parameters,
            "builtin": tool.is_builtin,
            "enabled": tool.enabled,
            "handler_type": tool.handler_type,
        }
        if tool.handler_type == HandlerType.HTTP_API or tool.api_url:
            data["api_url"] = tool.api_url
            data["api_method"] = tool.api_method
            data["api_headers"] = tool.api_headers
            data["api_body"] = tool.api_body
            data["api_timeout"] = tool.api_timeout
        return data


registry = ToolRegistry()
