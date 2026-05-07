from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from models.database import get_db, Note
from routes.auth import get_current_user, get_user_id
from services.pdf_service import PDFService
import os
import tempfile

router = APIRouter()


@router.get("/notes")
async def get_all_notes(
    search: str = Query(default=""),
    source_type: str = Query(default=""),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    uid = get_user_id(current_user)
    query = select(Note).where(Note.user_id == uid).order_by(Note.created_at.desc())

    if search:
        t = f"%{search}%"
        query = query.where(or_(Note.title.ilike(t), Note.transcript.ilike(t), Note.summary.ilike(t)))
    if source_type:
        query = query.where(Note.source_type == source_type)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    notes = result.scalars().all()

    return {
        "success": True,
        "notes": [{"id": n.id, "title": n.title, "summary": n.summary, "keywords": n.keywords,
                   "source_type": n.source_type, "language": n.language, "duration": n.duration,
                   "created_at": n.created_at.isoformat()} for n in notes],
        "total": len(notes)
    }


@router.get("/notes/{note_id}")
async def get_note(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    uid = get_user_id(current_user)
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == uid))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"success": True, "note": {"id": note.id, "title": note.title, "transcript": note.transcript,
            "summary": note.summary, "keywords": note.keywords, "source_type": note.source_type,
            "language": note.language, "duration": note.duration, "created_at": note.created_at.isoformat()}}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    uid = get_user_id(current_user)
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == uid))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.file_path and os.path.exists(note.file_path):
        os.remove(note.file_path)
    await db.delete(note)
    await db.commit()
    return {"success": True, "message": "Note deleted"}


@router.get("/notes/{note_id}/export/pdf")
async def export_pdf(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    uid = get_user_id(current_user)
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == uid))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note_data = {"title": note.title, "transcript": note.transcript, "summary": note.summary,
                 "keywords": note.keywords or [], "source_type": note.source_type,
                 "duration": note.duration, "created_at": note.created_at.strftime("%Y-%m-%d %H:%M")}

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.close()
    pdf_path = PDFService.generate_note_pdf(note_data, tmp.name)
    safe_title = "".join(c for c in note.title if c.isalnum() or c in " _-").strip()
    return FileResponse(path=pdf_path, media_type="application/pdf", filename=f"{safe_title or 'note'}.pdf")
