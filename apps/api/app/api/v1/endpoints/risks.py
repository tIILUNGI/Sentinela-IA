from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db
from app.models.risk import RiskAssessment
from app.models.incident import Incident
from app.models.organization import Organization
from app.models.user import User
from app.schemas.risk import RiskAssessmentCreate, RiskAssessmentOut
from app.services.audit import log_action
from app.services.risk import calculate_risk_score

router = APIRouter()


@router.get("", response_model=list[RiskAssessmentOut])
def list_risks(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("risks:read"))):
    return db.query(RiskAssessment).filter(RiskAssessment.organization_id == org.id).order_by(RiskAssessment.created_at.desc()).limit(200).all()


@router.post("/assess", response_model=RiskAssessmentOut)
def assess_risk(payload: RiskAssessmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("risks:create"))):
    if payload.incident_id:
        incident = db.get(Incident, payload.incident_id)
        if not incident or incident.organization_id != org.id:
            raise HTTPException(status_code=404, detail="Incident not found")

    result = calculate_risk_score(payload.probability, payload.impact, payload.exposure, payload.urgency, payload.evidence_quality)
    justification = payload.justification or (
        f"Deterministic score based on probability={payload.probability}, impact={payload.impact}, exposure={payload.exposure}, "
        f"urgency={payload.urgency}, evidence_quality={payload.evidence_quality}. "
        f"Calculated score={result.score} ({result.level})."
    )
    ra = RiskAssessment(
        organization_id=org.id,
        incident_id=payload.incident_id,
        probability=payload.probability,
        impact=payload.impact,
        exposure=payload.exposure,
        urgency=payload.urgency,
        evidence_quality=payload.evidence_quality,
        score=result.score,
        level=result.level,
        justification=justification,
        evidence_used=payload.evidence_used,
        uncertainties=payload.uncertainties or [],
        requires_human_review=result.requires_human_review,
        assessed_by=current_user.id,
    )
    db.add(ra)
    db.commit()
    db.refresh(ra)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="risk.assess", resource_type="risk_assessment", resource_id=str(ra.id), metadata={"score": result.score, "level": result.level})
    return ra


@router.get("/{risk_id}", response_model=RiskAssessmentOut)
def get_risk(risk_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("risks:read"))):
    ra = db.get(RiskAssessment, risk_id)
    if not ra or ra.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    return ra
