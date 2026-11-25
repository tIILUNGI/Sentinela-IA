import uuid
from sqlalchemy import String, Text, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
from app.db.types import PortableJSON

from app.db.base import Base, UUIDMixin, TimestampMixin


class RiskAssessment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "risk_assessments"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    incident_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True, nullable=True)
    probability: Mapped[int] = mapped_column(Integer, nullable=False)
    impact: Mapped[int] = mapped_column(Integer, nullable=False)
    exposure: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    urgency: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    evidence_quality: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_used: Mapped[list | dict | None] = mapped_column(PortableJSON, nullable=True)
    uncertainties: Mapped[list | None] = mapped_column(PortableJSON, nullable=True)
    requires_human_review: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    assessed_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    incident = relationship("Incident", back_populates="risk_assessments")

