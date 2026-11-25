from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_org, require_permission
from app.db.session import get_db, SessionLocal
from app.models.document import Document
from app.models.organization import Organization
from app.models.user import User
from app.schemas.document import DocumentOut, DocumentQuestionRequest, DocumentQuestionOut
from app.services.audit import log_action
from app.services.storage import StorageService
from app.services.documents import process_document, answer_document_question

router = APIRouter()

ALLOWED = {".pdf", ".docx", ".txt"}
MAX_SIZE = 20 * 1024 * 1024


async def _process_doc_bg(doc_id: str):
    db = SessionLocal()
    try:
        doc = db.get(Document, UUID(doc_id))
        if doc:
            await process_document(db, doc)
    finally:
        db.close()


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("documents:read"))):
    return db.query(Document).filter(Document.organization_id == org.id).order_by(Document.created_at.desc()).limit(200).all()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    _=Depends(require_permission("documents:upload")),
):
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX and TXT files are allowed")
    storage = StorageService()
    key, file_hash, size = await storage.save_upload(file, str(org.id))
    if size > MAX_SIZE:
        storage.delete(key)
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    doc = Document(
        organization_id=org.id,
        title=filename.rsplit(".", 1)[0],
        file_name=filename,
        mime_type=file.content_type or "application/octet-stream",
        storage_key=key,
        file_hash=file_hash,
        status="uploaded",
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="document.upload", resource_type="document", resource_id=str(doc.id), metadata={"file_name": filename, "size": size})
    background_tasks.add_task(_process_doc_bg, str(doc.id))
    return doc


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("documents:read"))):
    doc = db.get(Document, document_id)
    if not doc or doc.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/status", response_model=DocumentOut)
def get_document_status(document_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), _=Depends(require_permission("documents:read"))):
    return get_document(document_id, db, org, _=True)


@router.post("/{document_id}/analyze", response_model=DocumentOut)
async def analyze_document(document_id: UUID, db: Session = Depends(get_db), org: Organization = Depends(get_current_org), current_user: User = Depends(get_current_user), _=Depends(require_permission("documents:read"))):
    doc = db.get(Document, document_id)
    if not doc or doc.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = await process_document(db, doc)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="document.analyze", resource_type="document", resource_id=str(doc.id))
    return doc


@router.post("/{document_id}/questions", response_model=DocumentQuestionOut)
async def ask_document(
    document_id: UUID,
    payload: DocumentQuestionRequest,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    _=Depends(require_permission("documents:read")),
):
    doc = db.get(Document, document_id)
    if not doc or doc.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document not ready (status={doc.status})")
    dq = await answer_document_question(db, doc, payload.question, current_user.id)
    log_action(db, organization_id=org.id, user_id=current_user.id, action="document.question", resource_type="document", resource_id=str(doc.id))
    return dq
