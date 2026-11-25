from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class RiskAssessmentCreate(BaseModel):
    incident_id: UUID | None = None
    probability: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    exposure: int = Field(ge=1, le=5, default=3)
    urgency: int = Field(ge=1, le=5, default=3)
    evidence_quality: int = Field(ge=1, le=5, default=3)
    justification: str | None = None
    evidence_used: list | dict | None = None
    uncertainties: list[str] | None = None


class RiskAssessmentOut(BaseModel):
    id: UUID
    organization_id: UUID
    incident_id: UUID | None
    probability: int
    impact: int
    exposure: int
    urgency: int
    evidence_quality: int
    score: float
    level: str
    justification: str | None
    evidence_used: list | dict | None
    uncertainties: list | None
    requires_human_review: bool
    assessed_by: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
