from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=2)
    category: str | None = None
    sector_id: UUID | None = None
    location: str | None = None
    source: str | None = None
    severity: str = "medium"
    priority: str = "medium"
    status: str = "open"
    occurred_at: datetime | None = None
    assigned_to: UUID | None = None


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    sector_id: UUID | None = None
    location: str | None = None
    source: str | None = None
    severity: str | None = None
    priority: str | None = None
    status: str | None = None
    occurred_at: datetime | None = None
    assigned_to: UUID | None = None


class IncidentOut(BaseModel):
    id: UUID
    organization_id: UUID
    title: str
    description: str
    category: str | None
    sector_id: UUID | None
    location: str | None
    source: str | None
    severity: str
    priority: str
    status: str
    occurred_at: datetime | None
    created_by: UUID | None
    assigned_to: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentAnalysisOut(BaseModel):
    id: UUID
    incident_id: UUID
    summary: str | None
    suggested_category: str | None
    suggested_severity: str | None
    entities: dict | list | None
    missing_information: list | None
    justification: str | None
    recommended_next_steps: list | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
