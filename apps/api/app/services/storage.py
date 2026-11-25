import hashlib
import os
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings


class StorageService:
    def __init__(self):
        self.settings = get_settings()
        self.base = Path(self.settings.STORAGE_LOCAL_PATH)
        self.base.mkdir(parents=True, exist_ok=True)

    def _safe_name(self, filename: str) -> str:
        name = Path(filename).name.replace("\\", "_").replace("/", "_")
        return name or f"file-{uuid4().hex}"

    async def save_upload(self, upload: UploadFile, organization_id: str) -> tuple[str, str, int]:
        org_dir = self.base / organization_id
        org_dir.mkdir(parents=True, exist_ok=True)
        safe = self._safe_name(upload.filename or "upload.bin")
        key = f"{organization_id}/{uuid4().hex}-{safe}"
        dest = self.base / key
        dest.parent.mkdir(parents=True, exist_ok=True)

        hasher = hashlib.sha256()
        size = 0
        with dest.open("wb") as f:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                hasher.update(chunk)
                f.write(chunk)
        await upload.close()
        return key, hasher.hexdigest(), size

    def get_path(self, key: str) -> Path:
        # prevent path traversal
        base = self.base.resolve()
        target = (self.base / key).resolve()
        if base not in target.parents and target != base:
            raise ValueError("Invalid storage key")
        return target

    def read_bytes(self, key: str) -> bytes:
        return self.get_path(key).read_bytes()

    def delete(self, key: str) -> None:
        path = self.get_path(key)
        if path.exists():
            path.unlink()
