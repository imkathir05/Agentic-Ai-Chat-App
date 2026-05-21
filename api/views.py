from django.conf import settings as django_settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core import agents as agent_service
from core.agent import run_agent
from core.env_keys import get_gemini_api_key, get_groq_api_key
from core.tools.registry import registry


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request: Request) -> Response:
    provider = django_settings.LLM_PROVIDER
    if provider == "gemini":
        model = django_settings.GEMINI_MODEL
        has_key = bool(get_gemini_api_key())
    else:
        provider = "groq"
        model = django_settings.GROQ_MODEL
        has_key = bool(get_groq_api_key())
    return Response(
        {
            "status": "ok",
            "provider": provider,
            "framework": "django",
            "model": model,
            "has_api_key": has_key,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat(request: Request) -> Response:
    data = request.data
    messages = data.get("messages", [])
    api_key = (
        data.get("groq_api_key")
        or data.get("gemini_api_key")
        or data.get("api_key")
    )
    model = data.get("model")

    try:
        agent_id = data.get("agent_id")
        agent_cfg = agent_service.get_agent_for_chat(request.user, agent_id)
        msgs = [{"role": m["role"], "content": m["content"]} for m in messages]
        result = run_agent(
            msgs,
            api_key=api_key,
            model=model,
            system_prompt=agent_cfg["system_prompt"],
            tool_ids=agent_cfg["tool_ids"],
            agent_id=agent_cfg["id"],
            agent_name=agent_cfg["name"],
        )
        return Response(result)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def tools_list_create(request: Request) -> Response:
    if request.method == "GET":
        return Response({"tools": registry.list_tools()})

    data = request.data
    try:
        tool = registry.add_custom_tool(data)
        return Response(tool, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def tool_detail(request: Request, tool_id: str) -> Response:
    if request.method == "GET":
        tool = registry.get_tool(tool_id)
        if not tool:
            return Response({"detail": "Tool not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(tool)

    if request.method == "PATCH":
        try:
            updates = {k: v for k, v in request.data.items() if v is not None}
            return Response(registry.set_tool(tool_id, updates))
        except KeyError:
            return Response({"detail": "Tool not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        registry.delete_tool(tool_id)
        return Response({"deleted": tool_id})
    except KeyError:
        return Response({"detail": "Tool not found"}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def tool_toggle(_request: Request, tool_id: str) -> Response:
    tool = registry.get_tool(tool_id)
    if not tool:
        return Response({"detail": "Tool not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(registry.set_tool(tool_id, {"enabled": not tool["enabled"]}))
