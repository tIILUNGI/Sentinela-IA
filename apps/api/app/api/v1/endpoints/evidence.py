from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db
from app.models.evidence import Evidence, IncidentEvidence
from app.models.incident import Incident
from app.models.organization import Organization
from app.models.user import User
from app.schemas.evidence import EvidenceCreate, EvidenceOut, EvidenceLinkCreate, EvidenceLinkOut
from app.services.audit import log_action

router = APIRouter()


@router.get("", response_model=list[EvidenceOut])
def list_evidence(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("evidence:read"))):
    return db.query(Evidence).filter(Evidence.organization_id == org.id).order_by(Evidence.created_at.desc()).limit(200).all()


@router.post("", response_model=EvidenceOut)
def create_evidence(payload: EvidenceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("evidence:create"))):
    data = payload.model_dump()
    metadata = data.pop("metadata", None)
    ev = Evidence(organization_id=org.id, created_by=current_user.id, metadata_json=metadata, **data)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="evidence.create", resource_type="evidence", resource_id=str(ev.id))
    return ev


@router.get("/{evidence_id}", response_model=EvidenceOut)
def get_evidence(evidence_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("evidence:read"))):
    ev = db.get(Evidence, evidence_id)
    if not ev or ev.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return ev


@router.post("/correlate")
def correlate_evidence(
    payload: dict,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission("evidence:read")),
):
    """Basic correlation: finds incidents sharing keywords/location/category with the given incident or evidence.
    Returns suggested relations; does not auto-confirm."""
    incident_id = payload.get("incident_id")
    if not incident_id:
        raise HTTPException(status_code=400, detail="incident_id is required")
    incident = db.get(Incident, UUID(str(incident_id)))
    if not incident or incident.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Incident not found")

    candidates = db.query(Incident).filter(Incident.organization_id == org.id, Incident.id != incident.id).limit(200).all()
    suggestions = []
    base_tokens = set((incident.title + " " + incident.description + " " + (incident.location or "") + " " + (incident.category or "")).lower().split())
    for c in candidates:
        tokens = set((c.title + " " + c.description + " " + (c.location or "") + " " + (c.category or "")).lower().split())
        overlap = len(base_tokens & tokens)
        union = len(base_tokens | tokens) or 1
        score = overlap / union
        reasons = []
        if incident.category and c.category and incident.category.lower() == c.category.lower():
            reasons.append("same_category"); score += 0.15
        if incident.location and c.location and incident.location.lower() == c.location.lower():
            reasons.append("same_location"); score += 0.15
        if score >= 0.2:
            suggestions.append({
                "target_incident_id": str(c.id),
                "target_title": c.title,
                "score": round(min(score, 0.99), 3),
                "verification_status": "suggested",
                "reasons": reasons or ["text_overlap"],
                "explanation": "Suggested by deterministic text/entity overlap. Requires human confirmation.",
            })
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="evidence.correlate", resource_type="incident", resource_id=str(incident.id), metadata={"suggestions": len(suggestions[:10])})
    return {"incident_id": str(incident.id), "suggestions": suggestions[:10], "method": "deterministic_text_overlap_v1"}
