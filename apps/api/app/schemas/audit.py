from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: UUID
    organization_id: UUID | None
    user_id: UUID | None
    action: str
    resource_type: str
    resource_id: str | None
    metadata: dict | None = None
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_log(cls, obj):
        return cls(
            id=obj.id,
            organization_id=obj.organization_id,
            user_id=obj.user_id,
            action=obj.action,
            resource_type=obj.resource_type,
            resource_id=obj.resource_id,
            metadata=obj.metadata_json,
            ip_address=obj.ip_address,
            created_at=obj.created_at,
        )
