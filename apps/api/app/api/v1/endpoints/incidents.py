import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.ai.base import AIUnavailableError
from app.ai.factory import get_ai_provider
from app.db.session import get_db
from app.models.incident import Incident, IncidentAnalysis
from app.models.organization import Organization
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentOut, IncidentAnalysisOut
from app.services.audit import log_action

router = APIRouter()


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status: str | None = None,
    severity: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("incidents:read")),
):
    query = db.query(Incident).filter(Incident.organization_id == org.id)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if q:
        like = f"%{q}%"
        query = query.filter((Incident.title.ilike(like)) | (Incident.description.ilike(like)))
    return query.order_by(Incident.created_at.desc()).limit(200).all()


@router.post("", response_model=IncidentOut)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("incidents:create")),
):
    incident = Incident(organization_id=org.id, created_by=current_user.id, **payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="incident.create", resource_type="incident", resource_id=str(incident.id))
    return incident


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("incidents:read"))):
    incident = db.get(Incident, incident_id)
    if not incident or incident.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: UUID,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("incidents:update")),
):
    incident = db.get(Incident, incident_id)
    if not incident or incident.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Incident not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(incident, k, v)
    db.commit()
    db.refresh(incident)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="incident.update", resource_type="incident", resource_id=str(incident.id), metadata=payload.model_dump(exclude_unset=True))
    return incident


@router.post("/{incident_id}/analyze", response_model=IncidentAnalysisOut)
async def analyze_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("incidents:analyze")),
):
    incident = db.get(Incident, incident_id)
    if not incident or incident.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Incident not found")

    provider = get_ai_provider()
    system = (
        "You are SENTINELA AI Incident Intelligence. Analyze incidents and return STRICT JSON with keys: "
        "summary, suggested_category, suggested_severity, entities (array of {type,value}), missing_information (array of strings), "
        "justification, recommended_next_steps (array of strings). suggested_severity must be one of low,medium,high,critical. "
        "Do not invent facts; base conclusions on provided information."
    )
    prompt = f"""Incident:
Title: {incident.title}
Description: {incident.description}
Category: {incident.category}
Location: {incident.location}
Source: {incident.source}
Severity: {incident.severity}
Priority: {incident.priority}
Status: {incident.status}
Occurred at: {incident.occurred_at}
"""
    try:
        result = await provider.generate_text(prompt, system=system, temperature=0.1, json_mode=True)
        content = result.content.strip()
        try:
            data = json.loads(content)
        except Exception:
            # try to salvage JSON object
            start = content.find("{"); end = content.rfind("}")
            data = json.loads(content[start:end+1]) if start != -1 and end != -1 else {"summary": content}
    except AIUnavailableError as e:
        raise HTTPException(status_code=503, detail=f"AI unavailable: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    analysis = IncidentAnalysis(
        organization_id=org.id,
        incident_id=incident.id,
        summary=data.get("summary"),
        suggested_category=data.get("suggested_category"),
        suggested_severity=data.get("suggested_severity"),
        entities=data.get("entities"),
        missing_information=data.get("missing_information"),
        justification=data.get("justification"),
        recommended_next_steps=data.get("recommended_next_steps"),
        raw_response=data if isinstance(data, dict) else {"raw": data},
        status="draft",
        created_by=current_user.id,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="incident.analyze", resource_type="incident", resource_id=str(incident.id), metadata={"analysis_id": str(analysis.id)})
    return analysis


@router.get("/{incident_id}/analysis", response_model=list[IncidentAnalysisOut])
def get_incident_analyses(incident_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("incidents:read"))):
    incident = db.get(Incident, incident_id)
    if not incident or incident.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db.query(IncidentAnalysis).filter(IncidentAnalysis.incident_id == incident_id).order_by(IncidentAnalysis.created_at.desc()).all()
