from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db
from app.models.task import ActionTask
from app.models.organization import Organization
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.services.audit import log_action

router = APIRouter()


@router.get("", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("tasks:read"))):
    return db.query(ActionTask).filter(ActionTask.organization_id == org.id).order_by(ActionTask.created_at.desc()).limit(200).all()


@router.post("", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("tasks:*"))):
    task = ActionTask(organization_id=org.id, created_by=current_user.id, **payload.model_dump())
    db.add(task)
    db.commit(); db.refresh(task)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="task.create", resource_type="task", resource_id=str(task.id))
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: UUID, payload: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), org: Organization = Depends(get_current_org), _=Depends(require_permission("tasks:update"))):
    task = db.get(ActionTask, task_id)
    if not task or task.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit(); db.refresh(task)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="task.update", resource_type="task", resource_id=str(task.id), metadata=payload.model_dump(exclude_unset=True))
    return task
