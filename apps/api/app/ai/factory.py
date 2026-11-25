from app.ai.base import AIProvider, AIUnavailableError
from app.ai.openai_provider import OpenAICompatibleProvider
from app.core.config import get_settings


class UnavailableProvider:
    async def generate_text(self, *args, **kwargs):
        raise AIUnavailableError("AI provider is not configured or set to unavailable mode.")

    async def embed_texts(self, *args, **kwargs):
        raise AIUnavailableError("AI provider is not configured or set to unavailable mode.")


def get_ai_provider() -> AIProvider:
    settings = get_settings()
    provider = (settings.AI_PROVIDER or "").lower()
    if provider in {"openai", "azure_openai", "openai_compatible"}:
        if not settings.AI_API_KEY:
            return UnavailableProvider()  # type: ignore
        return OpenAICompatibleProvider()
    if provider in {"mock", "none", "disabled"}:
        return UnavailableProvider()  # type: ignore
    # default to openai-compatible if key present
    if settings.AI_API_KEY:
        return OpenAICompatibleProvider()
    return UnavailableProvider()  # type: ignore
