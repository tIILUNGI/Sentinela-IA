from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class RecommendationCreate(BaseModel):
    incident_id: UUID | None = None
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=2)
    priority: str = "medium"
    justification: str | None = None
    evidence_used: list | dict | None = None
    limitations: str | None = None


class RecommendationReview(BaseModel):
    review_notes: str | None = None


class RecommendationOut(BaseModel):
    id: UUID
    organization_id: UUID
    incident_id: UUID | None
    title: str
    description: str
    priority: str
    justification: str | None
    evidence_used: list | dict | None
    limitations: str | None
    status: str
    generated_by: str
    reviewed_by: UUID | None
    review_notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
