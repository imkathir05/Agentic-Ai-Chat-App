import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


def _generate_tool_id() -> str:
    return str(uuid.uuid4())[:12]


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        email = self.normalize_email(email) if email else ""
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    """Application user stored in the `users` table."""

    email = models.EmailField(blank=True, default="")
    display_name = models.CharField(max_length=150, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.username


class HandlerType(models.TextChoices):
    BUILTIN = "builtin", "Built-in (code)"
    HTTP_API = "http_api", "External HTTP API"
    ECHO_ARGS = "echo_args", "Echo arguments (test)"
    UPPERCASE = "uppercase", "Uppercase text"


class HttpMethod(models.TextChoices):
    GET = "GET", "GET"
    POST = "POST", "POST"
    PUT = "PUT", "PUT"
    DELETE = "DELETE", "DELETE"
    PATCH = "PATCH", "PATCH"


class AgentTool(models.Model):
    """Agent tool definition stored in the database."""

    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=_generate_tool_id,
        editable=False,
    )
    name = models.CharField(max_length=128, unique=True)
    description = models.TextField()
    parameters = models.JSONField(
        default=dict,
        help_text="JSON Schema for Gemini function parameters",
    )
    handler_type = models.CharField(
        max_length=32,
        choices=HandlerType.choices,
        default=HandlerType.ECHO_ARGS,
    )
    enabled = models.BooleanField(default=True)
    is_builtin = models.BooleanField(default=False)

    # HTTP API tool config
    api_url = models.TextField(blank=True, default="")
    api_method = models.CharField(
        max_length=10,
        choices=HttpMethod.choices,
        default=HttpMethod.GET,
        blank=True,
    )
    api_headers = models.JSONField(default=dict, blank=True)
    api_body = models.TextField(
        blank=True,
        default="",
        help_text="JSON body template with {param} placeholders for POST/PUT",
    )
    api_timeout = models.FloatField(default=15.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_tools"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Agent(models.Model):
    """Configurable agent with its own tools and system prompt."""

    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=_generate_tool_id,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="agents",
    )
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, default="")
    system_prompt = models.TextField(
        blank=True,
        default="",
        help_text="Instructions for the LLM; only this agent's tools are available.",
    )
    tools = models.ManyToManyField(
        AgentTool,
        related_name="agents",
        blank=True,
        help_text="Tools this agent is allowed to call",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agents"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_agent_name_per_user",
            )
        ]

    def __str__(self) -> str:
        return self.name
