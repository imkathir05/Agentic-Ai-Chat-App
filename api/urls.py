from django.urls import path

from . import agent_views, auth_views, views

urlpatterns = [
    path("api/health", views.health),
    path("api/auth/register", auth_views.register),
    path("api/auth/login", auth_views.login),
    path("api/auth/logout", auth_views.logout),
    path("api/auth/refresh", auth_views.refresh),
    path("api/auth/me", auth_views.me),
    path("api/agents", agent_views.agents_list_create),
    path("api/agents/<str:agent_id>", agent_views.agent_detail),
    path("api/agents/<str:agent_id>/tools", agent_views.agent_set_tools),
    path("api/chat", views.chat),
    path("api/tools", views.tools_list_create),
    path("api/tools/<str:tool_id>", views.tool_detail),
    path("api/tools/<str:tool_id>/toggle", views.tool_toggle),
]
