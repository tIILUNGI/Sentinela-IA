from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    incident_id: UUID | None = None
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    assigned_to: UUID | None = None
    due_date: datetime | None = None
    status: str = "open"


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to: UUID | None = None
    due_date: datetime | None = None
    status: str | None = None
    resolution_evidence: str | None = None


class TaskOut(BaseModel):
    id: UUID
    organization_id: UUID
    incident_id: UUID | None
    title: str
    description: str | None
    assigned_to: UUID | None
    due_date: datetime | None
    status: str
    resolution_evidence: str | None
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
