import uuid
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.db.types import PortableJSON

from app.db.base import Base, UUIDMixin, TimestampMixin


class Evidence(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "evidence"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(80), nullable=False)  # document, photo, report, testimony, log, other
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    incident_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", PortableJSON, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    incident_links = relationship("IncidentEvidence", back_populates="evidence", cascade="all, delete-orphan")


class IncidentEvidence(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "incident_evidence"

    incident_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True, nullable=False)
    evidence_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("evidence.id", ondelete="CASCADE"), index=True, nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(80), default="related", nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), default="suggested", nullable=False)  # suggested, confirmed, rejected
    confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    incident = relationship("Incident", back_populates="evidence_links")
    evidence = relationship("Evidence", back_populates="incident_links")
