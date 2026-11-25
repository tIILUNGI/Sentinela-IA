from dataclasses import dataclass
from typing import Any, Protocol


class AIUnavailableError(RuntimeError):
    pass


@dataclass
class AITextResult:
    content: str
    model: str
    raw: dict[str, Any] | None = None


class AIProvider(Protocol):
    async def generate_text(self, prompt: str, *, system: str | None = None, model: str | None = None, temperature: float = 0.2, json_mode: bool = False) -> AITextResult: ...
    async def embed_texts(self, texts: list[str], *, model: str | None = None) -> list[list[float]]: ...
