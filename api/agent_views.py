from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core import agents as agent_service


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def agents_list_create(request: Request) -> Response:
    if request.method == "GET":
        return Response({"agents": agent_service.list_agents(request.user)})

    try:
        agent = agent_service.create_agent(request.user, request.data)
        return Response(agent, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def agent_detail(request: Request, agent_id: str) -> Response:
    if request.method == "GET":
        agent = agent_service.get_agent(request.user, agent_id)
        if not agent:
            return Response({"detail": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(agent)

    if request.method == "PATCH":
        try:
            updates = {k: v for k, v in request.data.items() if v is not None}
            return Response(agent_service.update_agent(request.user, agent_id, updates))
        except KeyError:
            return Response({"detail": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        agent_service.delete_agent(request.user, agent_id)
        return Response({"deleted": agent_id})
    except KeyError:
        return Response({"detail": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def agent_set_tools(request: Request, agent_id: str) -> Response:
    tool_ids = request.data.get("tool_ids", [])
    if not isinstance(tool_ids, list):
        return Response(
            {"detail": "tool_ids must be a list"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        return Response(agent_service.set_agent_tools(request.user, agent_id, tool_ids))
    except KeyError:
        return Response({"detail": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
