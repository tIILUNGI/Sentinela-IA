from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    sector: str | None = None
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    sector: str | None = None
    description: str | None = None
    status: str | None = None


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str
    sector: str | None
    status: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SectorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None


class SectorOut(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: str | None
    active: bool

    model_config = {"from_attributes": True}
