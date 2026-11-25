from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class EvidenceCreate(BaseModel):
    type: str = Field(min_length=2, max_length=80)
    source: str | None = None
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    document_id: UUID | None = None
    incident_id: UUID | None = None
    metadata: dict | None = None


class EvidenceOut(BaseModel):
    id: UUID
    organization_id: UUID
    type: str
    source: str | None
    title: str
    description: str | None
    document_id: UUID | None
    incident_id: UUID | None
    file_hash: str | None
    metadata: dict | None = Field(default=None, validation_alias="metadata_json")
    created_by: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class EvidenceLinkCreate(BaseModel):
    evidence_id: UUID
    relationship_type: str = "related"
    verification_status: str = "suggested"
    confidence: str | None = None
    notes: str | None = None


class EvidenceLinkOut(BaseModel):
    id: UUID
    incident_id: UUID
    evidence_id: UUID
    relationship_type: str
    verification_status: str
    confidence: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
