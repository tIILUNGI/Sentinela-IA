from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, Membership, Role
from app.models.organization import Organization

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, uid)
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")
    return user


def get_current_org(
    x_organization_id: str | None = Header(default=None, alias="X-Organization-ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    memberships = (
        db.query(Membership)
        .filter(Membership.user_id == current_user.id, Membership.status == "active")
        .all()
    )
    if not memberships and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active organization membership")

    if x_organization_id:
        try:
            org_id = UUID(x_organization_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid X-Organization-ID")
        org = db.get(Organization, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        if current_user.is_superuser:
            return org
        if not any(m.organization_id == org_id for m in memberships):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")
        return org

    if current_user.is_superuser:
        org = db.query(Organization).order_by(Organization.created_at.asc()).first()
        if not org:
            raise HTTPException(status_code=404, detail="No organization found")
        return org

    org = db.get(Organization, memberships[0].organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


def get_current_membership(
    current_user: User = Depends(get_current_user),
    current_org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
) -> Membership | None:
    if current_user.is_superuser:
        return None
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == current_user.id,
            Membership.organization_id == current_org.id,
            Membership.status == "active",
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="No active membership")
    return membership


ROLE_PERMISSIONS = {
    "Super Admin": ["*"],
    "Organization Admin": [
        "org:read", "org:update", "users:manage", "incidents:*", "documents:*", "evidence:*",
        "risks:*", "recommendations:*", "tasks:*", "audit:read", "reports:*", "analytics:read",
    ],
    "Manager": [
        "org:read", "incidents:*", "documents:*", "evidence:*", "risks:*", "recommendations:*",
        "tasks:*", "audit:read", "reports:*", "analytics:read",
    ],
    "Analyst": [
        "org:read", "incidents:read", "incidents:create", "incidents:update", "incidents:analyze",
        "documents:*", "evidence:*", "risks:*", "recommendations:read", "recommendations:create",
        "tasks:read", "tasks:update", "analytics:read", "reports:read",
    ],
    "Operator": [
        "org:read", "incidents:read", "incidents:create", "incidents:update",
        "documents:read", "documents:upload", "evidence:read", "evidence:create",
        "tasks:read", "tasks:update", "analytics:read",
    ],
    "Viewer": [
        "org:read", "incidents:read", "documents:read", "evidence:read", "risks:read",
        "recommendations:read", "tasks:read", "audit:read", "analytics:read", "reports:read",
    ],
}


def has_permission(role_name: str, permission: str, explicit: list[str] | None = None) -> bool:
    perms = explicit if explicit is not None else ROLE_PERMISSIONS.get(role_name, [])
    if "*" in perms:
        return True
    if permission in perms:
        return True
    resource = permission.split(":")[0]
    return f"{resource}:*" in perms


def require_permission(permission: str):
    def dep(
        current_user: User = Depends(get_current_user),
        membership: Membership | None = Depends(get_current_membership),
        db: Session = Depends(get_db),
    ):
        if current_user.is_superuser:
            return True
        if not membership:
            raise HTTPException(status_code=403, detail="Membership required")
        role = db.get(Role, membership.role_id)
        if not role:
            raise HTTPException(status_code=403, detail="Role not found")
        role_perms = role.permissions if isinstance(role.permissions, list) and role.permissions else None
        if not has_permission(role.name, permission, role_perms):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return True

    return dep
