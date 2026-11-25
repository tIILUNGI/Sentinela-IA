import hashlib
import io
import json
import math
import re
from pathlib import Path
from uuid import UUID

import pymupdf as fitz  # PyMuPDF
from docx import Document as DocxDocument
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.ai.base import AIUnavailableError
from app.ai.factory import get_ai_provider
from app.models.document import Document, DocumentChunk, DocumentQuestion
from app.services.storage import StorageService


def extract_text_from_pdf(path: Path) -> tuple[list[dict], int]:
    pages = []
    doc = fitz.open(path)
    try:
        for i, page in enumerate(doc, start=1):
            txt = page.get_text("text") or ""
            pages.append({"page_number": i, "text": txt.strip()})
    finally:
        doc.close()
    return pages, len(pages)


def extract_text_from_docx(path: Path) -> tuple[list[dict], int]:
    doc = DocxDocument(str(path))
    paras = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
    text_content = "\n".join(paras)
    # DOCX has no reliable page mapping without rendering; treat as single section with page 1
    return [{"page_number": 1, "text": text_content}], 1


def extract_text_from_txt(path: Path) -> tuple[list[dict], int]:
    content = path.read_text(encoding="utf-8", errors="ignore")
    return [{"page_number": 1, "text": content.strip()}], 1


def chunk_pages(pages: list[dict], chunk_size: int = 1200, overlap: int = 200) -> list[dict]:
    chunks = []
    idx = 0
    for p in pages:
        text_content = re.sub(r"\s+", " ", (p.get("text") or "")).strip()
        if not text_content:
            continue
        start = 0
        while start < len(text_content):
            end = min(len(text_content), start + chunk_size)
            chunk_text = text_content[start:end].strip()
            if chunk_text:
                chunks.append({
                    "page_number": p.get("page_number"),
                    "chunk_index": idx,
                    "content": chunk_text,
                    "metadata": {"char_start": start, "char_end": end},
                })
                idx += 1
            if end >= len(text_content):
                break
            start = max(0, end - overlap)
    return chunks


async def process_document(db: Session, document: Document) -> Document:
    storage = StorageService()
    path = storage.get_path(document.storage_key)
    document.status = "processing"
    document.error_message = None
    db.commit()
    db.refresh(document)

    try:
        mime = (document.mime_type or "").lower()
        if "pdf" in mime or path.suffix.lower() == ".pdf":
            pages, page_count = extract_text_from_pdf(path)
        elif "word" in mime or "docx" in path.suffix.lower():
            pages, page_count = extract_text_from_docx(path)
        elif "text" in mime or path.suffix.lower() == ".txt":
            pages, page_count = extract_text_from_txt(path)
        else:
            raise ValueError(f"Unsupported file type: {document.mime_type}")

        extracted = "\n\n".join([f"[Page {p['page_number']}]\n{p['text']}" for p in pages if p.get("text")])
        document.extracted_text = extracted
        document.page_count = page_count

        # replace old chunks
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
        db.commit()

        chunks = chunk_pages(pages)
        provider = get_ai_provider()
        embeddings: list[list[float]] = []
        embed_error = None
        if chunks:
            try:
                embeddings = await provider.embed_texts([c["content"] for c in chunks])
            except AIUnavailableError as e:
                embed_error = str(e)
            except Exception as e:
                embed_error = f"Embedding failed: {e}"

        for i, c in enumerate(chunks):
            emb = embeddings[i] if i < len(embeddings) else None
            db.add(DocumentChunk(
                organization_id=document.organization_id,
                document_id=document.id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                content=c["content"],
                embedding=emb,
                metadata_json=c.get("metadata"),
            ))

        meta = document.metadata_json or {}
        meta["embedding_status"] = "ready" if embeddings else "unavailable"
        if embed_error:
            meta["embedding_error"] = embed_error[:500]
        document.metadata_json = meta
        document.status = "ready"
        db.commit()
        db.refresh(document)
        return document
    except Exception as e:
        document.status = "failed"
        document.error_message = str(e)[:1000]
        db.commit()
        db.refresh(document)
        return document


async def answer_document_question(db: Session, document: Document, question: str, user_id: UUID | None) -> DocumentQuestion:
    provider = get_ai_provider()
    # retrieve chunks
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id, DocumentChunk.organization_id == document.organization_id)
        .order_by(DocumentChunk.chunk_index.asc())
        .all()
    )
    if not chunks:
        dq = DocumentQuestion(
            organization_id=document.organization_id, document_id=document.id, question=question,
            answer="Não foi possível responder porque o documento não possui segmentos processados.",
            citations=[], status="no_evidence", asked_by=user_id,
        )
        db.add(dq); db.commit(); db.refresh(dq); return dq

    selected = chunks[:6]
    citations = []
    try:
        q_emb = await provider.embed_texts([question])
        if q_emb and q_emb[0]:
            qvec = q_emb[0]
            dialect = db.bind.dialect.name if db.bind else ""
            if dialect == "postgresql":
                rows = db.execute(text("""
                    SELECT id, page_number, chunk_index, content, 1 - (embedding <=> (:qvec)::vector) AS score
                    FROM document_chunks
                    WHERE document_id = :doc_id AND organization_id = :org_id AND embedding IS NOT NULL
                    ORDER BY embedding <=> (:qvec)::vector
                    LIMIT 6
                """), {"qvec": str(qvec), "doc_id": str(document.id), "org_id": str(document.organization_id)}).fetchall()
                if rows:
                    selected_ids = [r[0] for r in rows]
                    selected = [c for c in chunks if str(c.id) in [str(x) for x in selected_ids]]
                    order = {str(r[0]): i for i, r in enumerate(rows)}
                    selected.sort(key=lambda c: order.get(str(c.id), 999))
                    score_map = {str(r[0]): float(r[4]) for r in rows}
                else:
                    score_map = {}
            else:
                # SQLite/dev fallback: cosine similarity in Python
                def _cos(a, b):
                    dot = sum(x*y for x, y in zip(a, b))
                    na = math.sqrt(sum(x*x for x in a))
                    nb = math.sqrt(sum(y*y for y in b))
                    return dot / (na * nb) if na and nb else 0.0
                scored = []
                for c in chunks:
                    emb = c.embedding
                    if isinstance(emb, str):
                        try: emb = json.loads(emb)
                        except Exception: emb = None
                    if isinstance(emb, list) and emb:
                        try:
                            scored.append((float(_cos(qvec, emb)), c))
                        except Exception:
                            pass
                scored.sort(key=lambda x: x[0], reverse=True)
                top = scored[:6]
                if top:
                    selected = [c for _, c in top]
                    score_map = {str(c.id): s for s, c in top}
                else:
                    score_map = {}
        else:
            score_map = {}
    except Exception:
        # fallback to simple keyword overlap when embeddings unavailable
        q_tokens = set(re.findall(r"\w+", question.lower()))
        scored = []
        for c in chunks:
            tokens = set(re.findall(r"\w+", (c.content or "").lower()))
            overlap = len(q_tokens & tokens)
            if overlap:
                scored.append((overlap / (len(q_tokens) or 1), c))
        scored.sort(key=lambda x: x[0], reverse=True)
        if scored:
            selected = [c for _, c in scored[:6]]
            score_map = {str(c.id): float(s) for s, c in scored[:6]}
        else:
            score_map = {}
            # fallback to first chunks

    context_blocks = []
    for c in selected:
        score = score_map.get(str(c.id))
        citations.append({
            "document_id": str(document.id),
            "page_number": c.page_number,
            "chunk_index": c.chunk_index,
            "excerpt": c.content[:300],
            "score": score,
        })
        context_blocks.append(f"[Page {c.page_number}, Chunk {c.chunk_index}]\n{c.content}")

    context = "\n\n---\n\n".join(context_blocks)
    system = (
        "You are SENTINELA AI Document Intelligence. Answer using only the provided document excerpts. "
        "If evidence is insufficient, say so clearly. Do not invent facts. "
        "Return a concise, professional answer in the same language as the question when possible."
    )
    prompt = f"Question:\n{question}\n\nDocument excerpts:\n{context}\n\nProvide an evidence-based answer."
    try:
        result = await provider.generate_text(prompt, system=system, temperature=0.1)
        answer = result.content.strip()
        status = "answered"
        model = result.model
    except AIUnavailableError as e:
        answer = f"AI indisponível: {e}. As referências recuperadas estão disponíveis, mas a síntese automática não foi gerada."
        status = "ai_unavailable"
        model = None
    except Exception as e:
        answer = f"Falha ao gerar resposta: {e}"
        status = "failed"
        model = None

    dq = DocumentQuestion(
        organization_id=document.organization_id, document_id=document.id, question=question,
        answer=answer, citations=citations, model=model, status=status, asked_by=user_id,
    )
    db.add(dq); db.commit(); db.refresh(dq)
    return dq
