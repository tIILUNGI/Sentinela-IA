from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db
from app.models.organization import Organization, Sector
from app.models.user import User, Membership
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationOut, SectorCreate, SectorOut
from app.services.audit import log_action

router = APIRouter()


@router.get("", response_model=list[OrganizationOut])
def list_orgs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_superuser:
        return db.query(Organization).order_by(Organization.created_at.desc()).all()
    org_ids = [m.organization_id for m in db.query(Membership).filter(Membership.user_id == current_user.id, Membership.status == "active").all()]
    if not org_ids:
        return []
    return db.query(Organization).filter(Organization.id.in_(org_ids)).order_by(Organization.created_at.desc()).all()


@router.post("", response_model=OrganizationOut)
def create_org(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only super admin can create organizations")
    if db.query(Organization).filter(Organization.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="organization.create", resource_type="organization", resource_id=str(org.id))
    return org


@router.get("/{org_id}", response_model=OrganizationOut)
def get_org(org_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if not current_user.is_superuser:
        member = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.organization_id == org_id, Membership.status == "active").first()
        if not member:
            raise HTTPException(status_code=403, detail="Not allowed")
    return org


@router.patch("/{org_id}", response_model=OrganizationOut)
def update_org(
    org_id: UUID,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission("org:update")),
):
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="organization.update", resource_type="organization", resource_id=str(org.id), metadata=payload.model_dump(exclude_unset=True))
    return org


@router.get("/{org_id}/sectors", response_model=list[SectorOut])
def list_sectors(org_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # membership check
    if not current_user.is_superuser:
        member = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.organization_id == org_id, Membership.status == "active").first()
        if not member:
            raise HTTPException(status_code=403, detail="Not allowed")
    return db.query(Sector).filter(Sector.organization_id == org_id).order_by(Sector.name.asc()).all()


@router.post("/{org_id}/sectors", response_model=SectorOut)
def create_sector(
    org_id: UUID,
    payload: SectorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission("org:update")),
):
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    sector = Sector(organization_id=org_id, **payload.model_dump())
    db.add(sector)
    db.commit()
    db.refresh(sector)
    return sector
