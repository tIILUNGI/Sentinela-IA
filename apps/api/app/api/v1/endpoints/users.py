from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User, Membership, Role
from app.models.organization import Organization
from app.services.audit import log_action

router = APIRouter()


class UserCreate(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)
    role_name: str = "Viewer"


class UserUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    role_name: str | None = None


class UserMgmtOut(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    status: str
    is_superuser: bool
    role_name: str | None = None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[UserMgmtOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("users:manage")),
):
    rows = (
        db.query(User, Membership, Role)
        .join(Membership, Membership.user_id == User.id)
        .join(Role, Role.id == Membership.role_id)
        .filter(Membership.organization_id == org.id)
        .order_by(User.name.asc())
        .all()
    )
    return [UserMgmtOut(id=u.id, name=u.name, email=u.email, status=u.status, is_superuser=u.is_superuser, role_name=r.name) for u, m, r in rows]


@router.post("", response_model=UserMgmtOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("users:manage")),
):
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found")
    if not user:
        user = User(name=payload.name, email=email, password_hash=get_password_hash(payload.password), status="active")
        db.add(user)
        db.commit()
        db.refresh(user)
    existing_ms = db.query(Membership).filter(Membership.user_id == user.id, Membership.organization_id == org.id).first()
    if existing_ms:
        raise HTTPException(status_code=400, detail="User already in organization")
    db.add(Membership(organization_id=org.id, user_id=user.id, role_id=role.id, status="active"))
    db.commit()
    log_action(db, organization_id=org.id, user_id=current_user.id, action="user.create", resource_type="user", resource_id=str(user.id))
    return UserMgmtOut(id=user.id, name=user.name, email=user.email, status=user.status, is_superuser=user.is_superuser, role_name=role.name)


@router.patch("/{user_id}", response_model=UserMgmtOut)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("users:manage")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ms = db.query(Membership).filter(Membership.user_id == user_id, Membership.organization_id == org.id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Membership not found")
    if payload.name is not None:
        user.name = payload.name
    if payload.status is not None:
        user.status = payload.status
    if payload.role_name is not None:
        role = db.query(Role).filter(Role.name == payload.role_name).first()
        if not role:
            raise HTTPException(status_code=400, detail="Role not found")
        ms.role_id = role.id
    db.commit()
    db.refresh(user)
    role = db.get(Role, ms.role_id)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="user.update", resource_type="user", resource_id=str(user.id), metadata=payload.model_dump(exclude_unset=True))
    return UserMgmtOut(id=user.id, name=user.name, email=user.email, status=user.status, is_superuser=user.is_superuser, role_name=role.name if role else None)
