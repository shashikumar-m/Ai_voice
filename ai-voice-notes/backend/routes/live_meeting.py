import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db, Note, MeetingSession
from services.groq_service import GroqService
from datetime import datetime

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

active_meetings: dict = {}


@router.post("/meeting/start")
async def start_meeting(db: AsyncSession = Depends(get_db)):
    session = MeetingSession(status="recording", started_at=datetime.utcnow())
    db.add(session)
    await db.commit()
    await db.refresh(session)

    active_meetings[session.id] = {"chunks": [], "transcript_parts": []}

    return {
        "success": True,
        "session_id": session.id,
        "message": "Meeting started. Connect to WebSocket to stream audio."
    }


@router.post("/meeting/{session_id}/end")
async def end_meeting(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MeetingSession).where(MeetingSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Meeting session not found")
    if session.status != "recording":
        raise HTTPException(status_code=400, detail="Meeting is not in recording state")

    session.status = "processing"
    session.ended_at = datetime.utcnow()
    await db.commit()

    meeting_data = active_meetings.get(session_id, {})
    transcript_parts = meeting_data.get("transcript_parts", [])

    if not transcript_parts:
        session.status = "done"
        await db.commit()
        return {"success": False, "message": "No audio was recorded"}

    full_transcript = " ".join(transcript_parts)

    try:
        groq = GroqService()
        summary = await groq.summarize_text(full_transcript)
        keywords = await groq.extract_keywords(full_transcript)

        note = Note(
            title=f"Live Meeting - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
            transcript=full_transcript,
            summary=summary,
            keywords=keywords,
            source_type="live_meeting",
            language="en",
            duration=(session.ended_at - session.started_at).total_seconds()
        )
        db.add(note)
        session.status = "done"
        await db.commit()
        await db.refresh(note)

        if session_id in active_meetings:
            del active_meetings[session_id]

        return {
            "success": True,
            "note_id": note.id,
            "title": note.title,
            "transcript": full_transcript,
            "summary": summary,
            "keywords": keywords,
            "duration": note.duration,
            "created_at": note.created_at.isoformat()
        }

    except Exception as e:
        session.status = "error"
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/meeting/{session_id}/stream")
async def meeting_audio_stream(websocket: WebSocket, session_id: int):
    await websocket.accept()

    if session_id not in active_meetings:
        await websocket.send_json({"error": "Session not found or not started"})
        await websocket.close()
        return

    groq = GroqService()
    chunk_index = 0

    try:
        while True:
            data = await websocket.receive()

            if "bytes" in data:
                audio_chunk = data["bytes"]
                chunk_path = os.path.join(UPLOAD_DIR, f"meeting_{session_id}_chunk_{chunk_index}.webm")
                os.makedirs(UPLOAD_DIR, exist_ok=True)

                with open(chunk_path, "wb") as f:
                    f.write(audio_chunk)

                try:
                    partial_transcript = await groq.transcribe_audio(chunk_path)
                    if partial_transcript and len(partial_transcript.strip()) > 0:
                        active_meetings[session_id]["transcript_parts"].append(partial_transcript.strip())
                        active_meetings[session_id]["chunks"].append(chunk_path)
                        await websocket.send_json({
                            "type": "partial_transcript",
                            "text": partial_transcript.strip(),
                            "chunk_index": chunk_index
                        })
                    chunk_index += 1
                except Exception as e:
                    await websocket.send_json({"type": "error", "message": f"Chunk transcription failed: {str(e)}"})
                finally:
                    if os.path.exists(chunk_path):
                        os.remove(chunk_path)

            elif "text" in data:
                msg = json.loads(data["text"])
                if msg.get("action") == "end":
                    await websocket.send_json({"type": "ended", "message": "Meeting ended"})
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


@router.get("/meeting/{session_id}/status")
async def get_meeting_status(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MeetingSession).where(MeetingSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Meeting session not found")

    transcript_parts = active_meetings.get(session_id, {}).get("transcript_parts", [])

    return {
        "success": True,
        "session_id": session.id,
        "status": session.status,
        "chunks_count": len(transcript_parts),
        "started_at": session.started_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None
    }
