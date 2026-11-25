from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db
from app.models.recommendation import Recommendation
from app.models.organization import Organization
from app.models.user import User
from app.schemas.recommendation import RecommendationCreate, RecommendationReview, RecommendationOut
from app.services.audit import log_action

router = APIRouter()


@router.get("", response_model=list[RecommendationOut])
def list_recommendations(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("recommendations:read"))):
    return db.query(Recommendation).filter(Recommendation.organization_id == org.id).order_by(Recommendation.created_at.desc()).limit(200).all()


@router.post("", response_model=RecommendationOut)
def create_recommendation(payload: RecommendationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("recommendations:create"))):
    rec = Recommendation(organization_id=org.id, generated_by="human", **payload.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="recommendation.create", resource_type="recommendation", resource_id=str(rec.id))
    return rec


@router.post("/{rec_id}/approve", response_model=RecommendationOut)
def approve_recommendation(rec_id: UUID, payload: RecommendationReview, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("recommendations:*"))):
    rec = db.get(Recommendation, rec_id)
    if not rec or rec.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "approved"
    rec.reviewed_by = current_user.id
    rec.review_notes = payload.review_notes
    db.commit(); db.refresh(rec)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="recommendation.approve", resource_type="recommendation", resource_id=str(rec.id))
    return rec


@router.post("/{rec_id}/reject", response_model=RecommendationOut)
def reject_recommendation(rec_id: UUID, payload: RecommendationReview, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("recommendations:*"))):
    rec = db.get(Recommendation, rec_id)
    if not rec or rec.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "rejected"
    rec.reviewed_by = current_user.id
    rec.review_notes = payload.review_notes
    db.commit(); db.refresh(rec)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="recommendation.reject", resource_type="recommendation", resource_id=str(rec.id))
    return rec
