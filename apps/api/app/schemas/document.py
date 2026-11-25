from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: UUID
    organization_id: UUID
    title: str
    file_name: str
    mime_type: str
    status: str
    page_count: int | None
    file_hash: str | None
    error_message: str | None
    uploaded_by: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentQuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)


class CitationOut(BaseModel):
    document_id: UUID
    page_number: int | None
    chunk_index: int | None
    excerpt: str
    score: float | None = None


class DocumentQuestionOut(BaseModel):
    id: UUID
    document_id: UUID
    question: str
    answer: str | None
    citations: list | dict | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
