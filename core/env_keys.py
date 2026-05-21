import os

from django.conf import settings as django_settings
from dotenv import load_dotenv


def _reload_dotenv() -> None:
    load_dotenv(django_settings.BASE_DIR / ".env", override=True)


def get_groq_api_key(explicit: str | None = None) -> str:
    if explicit and str(explicit).strip():
        return str(explicit).strip()

    key = (django_settings.GROQ_API_KEY or "").strip()
    if not key:
        _reload_dotenv()
        key = os.getenv("GROQ_API_KEY", "").strip()
    return key


def get_gemini_api_key(explicit: str | None = None) -> str:
    if explicit and str(explicit).strip():
        return str(explicit).strip()

    key = (django_settings.GEMINI_API_KEY or "").strip()
    if not key:
        _reload_dotenv()
        key = (
            os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")) or ""
        ).strip()
    return key
