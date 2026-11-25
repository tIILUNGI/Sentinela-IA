import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.db.types import PortableJSON

from app.db.base import Base, UUIDMixin, TimestampMixin


class Incident(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "incidents"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sector_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("sectors.id", ondelete="SET NULL"), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False, index=True)
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    analyses = relationship("IncidentAnalysis", back_populates="incident", cascade="all, delete-orphan")
    evidence_links = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="incident", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="incident", cascade="all, delete-orphan")
    tasks = relationship("ActionTask", back_populates="incident", cascade="all, delete-orphan")


class IncidentAnalysis(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "incident_analyses"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    incident_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    suggested_severity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entities: Mapped[dict | list | None] = mapped_column(PortableJSON, nullable=True)
    missing_information: Mapped[list | None] = mapped_column(PortableJSON, nullable=True)
    justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_next_steps: Mapped[list | None] = mapped_column(PortableJSON, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(PortableJSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)  # draft, reviewed, applied
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    incident = relationship("Incident", back_populates="analyses")
