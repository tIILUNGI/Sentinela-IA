from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_org, require_permission
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.organization import Organization
from app.schemas.audit import AuditLogOut

router = APIRouter()


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    action: str | None = None,
    resource_type: str | None = None,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("audit:read")),
):
    query = db.query(AuditLog).filter(AuditLog.organization_id == org.id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type.ilike(f"%{resource_type}%"))
    logs = query.order_by(AuditLog.created_at.desc()).limit(200).all()
    return [AuditLogOut.from_orm_log(l) for l in logs]
