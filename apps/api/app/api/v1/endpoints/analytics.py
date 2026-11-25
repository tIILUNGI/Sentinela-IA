from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_org, require_permission
from app.db.session import get_db
from app.models.organization import Organization
from app.models.incident import Incident
from app.models.document import Document
from app.models.evidence import Evidence
from app.models.risk import RiskAssessment
from app.models.recommendation import Recommendation
from app.models.task import ActionTask

router = APIRouter()


@router.get("/overview")
def overview(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("analytics:read"))):
    inc_agg = (
        db.query(
            func.count(Incident.id).label("total"),
            func.coalesce(func.sum(case((Incident.status.in_(["open", "in_progress", "pending"]), 1), else_=0)), 0).label("open"),
            func.coalesce(func.sum(case((Incident.severity == "critical", 1), else_=0)), 0).label("critical"),
            func.coalesce(func.sum(case((Incident.status.in_(["resolved", "closed"]), 1), else_=0)), 0).label("resolved"),
        )
        .filter(Incident.organization_id == org.id)
        .one()
    )

    docs_processed = db.query(func.count(Document.id)).filter(Document.organization_id == org.id, Document.status == "ready").scalar() or 0
    evidence_count = db.query(func.count(Evidence.id)).filter(Evidence.organization_id == org.id).scalar() or 0
    risk_agg = db.query(func.count(RiskAssessment.id), func.coalesce(func.avg(RiskAssessment.score), 0)).filter(RiskAssessment.organization_id == org.id).one()
    pending_recs = db.query(func.count(Recommendation.id)).filter(Recommendation.organization_id == org.id, Recommendation.status == "pending").scalar() or 0
    open_tasks = db.query(func.count(ActionTask.id)).filter(ActionTask.organization_id == org.id, ActionTask.status.in_(["open", "in_progress"])).scalar() or 0

    by_severity_rows = db.query(Incident.severity, func.count(Incident.id)).filter(Incident.organization_id == org.id).group_by(Incident.severity).all()
    by_severity = [{"name": s or "unknown", "value": c} for s, c in by_severity_rows]

    by_status_rows = db.query(Incident.status, func.count(Incident.id)).filter(Incident.organization_id == org.id).group_by(Incident.status).all()
    by_status = [{"name": s or "unknown", "value": c} for s, c in by_status_rows]

    today = datetime.now(timezone.utc).date()
    start_7d = datetime.combine(today - timedelta(days=6), datetime.min.time(), tzinfo=timezone.utc)
    recent_dates = (
        db.query(Incident.created_at)
        .filter(Incident.organization_id == org.id, Incident.created_at >= start_7d)
        .all()
    )
    counts_by_day: dict[str, int] = {}
    for (dt,) in recent_dates:
        if dt is not None:
            day_key = dt.date().isoformat()
            counts_by_day[day_key] = counts_by_day.get(day_key, 0) + 1
    trend = [
        {"date": (today - timedelta(days=i)).isoformat(), "incidents": counts_by_day.get((today - timedelta(days=i)).isoformat(), 0)}
        for i in range(6, -1, -1)
    ]

    recent = db.query(Incident).filter(Incident.organization_id == org.id).order_by(Incident.created_at.desc()).limit(5).all()
    recent_activity = [{"id": str(i.id), "title": i.title, "status": i.status, "severity": i.severity, "created_at": i.created_at.isoformat()} for i in recent]

    return {
        "metrics": {
            "total_incidents": inc_agg.total or 0,
            "open_incidents": int(inc_agg.open or 0),
            "critical_incidents": int(inc_agg.critical or 0),
            "resolved_incidents": int(inc_agg.resolved or 0),
            "documents_processed": docs_processed,
            "evidence_items": evidence_count,
            "risk_assessments": risk_agg[0] or 0,
            "average_risk_score": round(float(risk_agg[1] or 0), 1),
            "pending_recommendations": pending_recs,
            "open_tasks": open_tasks,
        },
        "incidents_by_severity": by_severity,
        "incidents_by_status": by_status,
        "incident_trend_7d": trend,
        "recent_activity": recent_activity,
    }

@router.get("/incidents")
def incidents_analytics(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("analytics:read"))):
    by_category = db.query(Incident.category, func.count(Incident.id)).filter(Incident.organization_id == org.id).group_by(Incident.category).all()
    by_severity = db.query(Incident.severity, func.count(Incident.id)).filter(Incident.organization_id == org.id).group_by(Incident.severity).all()
    by_status = db.query(Incident.status, func.count(Incident.id)).filter(Incident.organization_id == org.id).group_by(Incident.status).all()
    return {
        "by_category": [{"name": c or "uncategorized", "value": n} for c, n in by_category],
        "by_severity": [{"name": s or "unknown", "value": n} for s, n in by_severity],
        "by_status": [{"name": s or "unknown", "value": n} for s, n in by_status],
    }


@router.get("/risks")
def risks_analytics(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("analytics:read"))):
    by_level = db.query(RiskAssessment.level, func.count(RiskAssessment.id)).filter(RiskAssessment.organization_id == org.id).group_by(RiskAssessment.level).all()
    avg_score = db.query(func.avg(RiskAssessment.score)).filter(RiskAssessment.organization_id == org.id).scalar() or 0
    return {
        "by_level": [{"name": l or "unknown", "value": n} for l, n in by_level],
        "average_score": round(float(avg_score), 2),
    }
