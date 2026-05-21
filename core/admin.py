from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Agent, AgentTool, User


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "tools_count_display", "updated_at")
    list_filter = ("user",)
    search_fields = ("name", "description")
    filter_horizontal = ("tools",)

    @admin.display(description="Tools")
    def tools_count_display(self, obj: Agent) -> int:
        return obj.tools.count()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "display_name", "is_active", "created_at")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "display_name")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "last_login", "date_joined")

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("display_name", "created_at", "updated_at")}),
    )


@admin.register(AgentTool)
class AgentToolAdmin(admin.ModelAdmin):
    list_display = ("name", "handler_type", "enabled", "is_builtin", "updated_at")
    list_filter = ("handler_type", "enabled", "is_builtin")
    search_fields = ("name", "description")
