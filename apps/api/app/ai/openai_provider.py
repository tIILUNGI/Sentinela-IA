from typing import Any

import httpx

from app.ai.base import AIProvider, AITextResult, AIUnavailableError
from app.core.config import get_settings


class OpenAICompatibleProvider(AIProvider):
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.AI_API_KEY
        self.base_url = (self.settings.AI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
        self.timeout = self.settings.AI_TIMEOUT_SECONDS

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise AIUnavailableError("AI_API_KEY is not configured. Set AI_API_KEY in the environment.")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate_text(self, prompt: str, *, system: str | None = None, model: str | None = None, temperature: float = 0.2, json_mode: bool = False) -> AITextResult:
        model_name = model or self.settings.AI_MODEL
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        payload: dict[str, Any] = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=self._headers(), json=payload)
            if resp.status_code >= 400:
                raise AIUnavailableError(f"AI provider error {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return AITextResult(content=content, model=model_name, raw=data)

    async def embed_texts(self, texts: list[str], *, model: str | None = None) -> list[list[float]]:
        if not texts:
            return []
        model_name = model or self.settings.EMBEDDING_MODEL
        payload = {"model": model_name, "input": texts}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(f"{self.base_url}/embeddings", headers=self._headers(), json=payload)
            if resp.status_code >= 400:
                raise AIUnavailableError(f"Embedding provider error {resp.status_code}: {resp.text[:300]}")
            data = resp.json()
        items = sorted(data.get("data", []), key=lambda x: x.get("index", 0))
        return [item.get("embedding", []) for item in items]
