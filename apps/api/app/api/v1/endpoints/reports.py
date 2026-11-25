import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_org, require_permission
from app.db.session import get_db
from app.models.organization import Organization
from app.models.incident import Incident
from app.models.risk import RiskAssessment
from app.models.recommendation import Recommendation

router = APIRouter()


def _safe_csv_cell(value) -> str:
    s = "" if value is None else str(value)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{s}"
    return s


def _csv_response(filename: str, headers: list[str], rows: list[list]):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for r in rows:
        writer.writerow([_safe_csv_cell(c) for c in r])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/incidents.csv")
def export_incidents_csv(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("reports:read"))):
    items = db.query(Incident).filter(Incident.organization_id == org.id).order_by(Incident.created_at.desc()).all()
    rows = [[str(i.id), i.title, i.category or "", i.severity, i.priority, i.status, i.location or "", i.created_at.isoformat()] for i in items]
    return _csv_response("incidents.csv", ["id","title","category","severity","priority","status","location","created_at"], rows)


@router.get("/risks.csv")
def export_risks_csv(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("reports:read"))):
    items = db.query(RiskAssessment).filter(RiskAssessment.organization_id == org.id).order_by(RiskAssessment.created_at.desc()).all()
    rows = [[str(r.id), str(r.incident_id) if r.incident_id else "", r.probability, r.impact, r.exposure, r.urgency, r.evidence_quality, r.score, r.level, r.created_at.isoformat()] for r in items]
    return _csv_response("risks.csv", ["id","incident_id","probability","impact","exposure","urgency","evidence_quality","score","level","created_at"], rows)


@router.get("/recommendations.csv")
def export_recommendations_csv(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("reports:read"))):
    items = db.query(Recommendation).filter(Recommendation.organization_id == org.id).order_by(Recommendation.created_at.desc()).all()
    rows = [[str(r.id), str(r.incident_id) if r.incident_id else "", r.title, r.priority, r.status, r.generated_by, r.created_at.isoformat()] for r in items]
    return _csv_response("recommendations.csv", ["id","incident_id","title","priority","status","generated_by","created_at"], rows)
