import os
import uuid
import time
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import get_db, Note
from routes.auth import get_current_user, get_user_id
from services.groq_service import GroqService
from services.ffmpeg_service import FFmpegService
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 100))

ALLOWED_AUDIO = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm"}
ALLOWED_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def log(step: str, msg: str, elapsed: float = None):
    t = f"  [{elapsed:.1f}s]" if elapsed else ""
    print(f"\n{'='*55}")
    print(f"  STEP {step}{t}")
    print(f"  {msg}")
    print(f"{'='*55}")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    title: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    start = time.time()
    user_id = get_user_id(current_user)

    print(f"\n{'#'*55}")
    print(f"  NEW UPLOAD REQUEST")
    print(f"  File     : {file.filename}")
    print(f"  Language : {language}")
    print(f"  User     : {user_id}")
    print(f"{'#'*55}")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AUDIO and ext not in ALLOWED_VIDEO:
        raise HTTPException(status_code=400, detail=f"Unsupported file type.")

    file_id = str(uuid.uuid4())
    original_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Step 1: Save file
    log("1/5", "Saving uploaded file to disk...")
    t0 = time.time()
    content = await file.read()
    size_mb = len(content) / 1024 / 1024

    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_FILE_SIZE_MB}MB")

    with open(original_path, "wb") as f:
        f.write(content)
    print(f"  >> Saved {size_mb:.2f} MB in {time.time()-t0:.1f}s")

    audio_path = original_path
    source_type = "audio"
    duration = 0.0

    try:
        # Step 2: Extract audio if video
        if ext in ALLOWED_VIDEO:
            log("2/5", f"Extracting audio from video...", time.time()-start)
            t0 = time.time()
            source_type = "video"
            audio_path = os.path.join(UPLOAD_DIR, f"{file_id}_audio.mp3")
            FFmpegService.extract_audio_from_video(original_path, audio_path)
            print(f"  >> Audio extracted in {time.time()-t0:.1f}s")
        else:
            log("2/5", "Audio file — skipping extraction", time.time()-start)

        # Get duration
        try:
            duration = FFmpegService.get_audio_duration(audio_path)
            print(f"  >> Duration: {int(duration//60)}m {int(duration%60)}s")
        except Exception:
            duration = 0.0

        # Step 3: Enhance audio
        log("3/5", "Enhancing audio (noise reduction + normalization)...", time.time()-start)
        t0 = time.time()
        # Enhancement happens inside transcribe_audio via whisper_service

        # Step 4: Transcribe
        log("4/5", f"Transcribing with Whisper '{os.getenv('WHISPER_MODEL','small')}' model...", time.time()-start)
        t0 = time.time()
        groq = GroqService()
        transcript = await groq.transcribe_audio(audio_path, language)

        if not transcript or len(transcript.strip()) < 10:
            raise HTTPException(status_code=422, detail="Could not extract speech from the file")

        words = len(transcript.split())
        print(f"  >> Transcribed {words} words in {time.time()-t0:.1f}s")
        print(f"  >> Preview: {transcript[:100]}...")

        # Step 5: Summarize + keywords
        log("5/5", "Generating summary and extracting keywords...", time.time()-start)
        t0 = time.time()
        summary = await groq.summarize_text(transcript)
        keywords = await groq.extract_keywords(transcript)
        print(f"  >> Summary generated in {time.time()-t0:.1f}s")
        print(f"  >> Keywords: {', '.join(keywords[:5])}")

        note_title = title.strip() if title.strip() else file.filename.rsplit(".", 1)[0]

        # Save to DB
        note = Note(
            user_id=user_id,
            title=note_title,
            transcript=transcript,
            summary=summary,
            keywords=keywords,
            source_type=source_type,
            language=language,
            duration=duration,
            file_path=original_path
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)

        total = time.time() - start
        print(f"\n{'#'*55}")
        print(f"  DONE! Note ID: {note.id} | Total time: {total:.1f}s")
        print(f"{'#'*55}\n")

        return JSONResponse({
            "success": True,
            "note_id": note.id,
            "title": note.title,
            "transcript": transcript,
            "summary": summary,
            "keywords": keywords,
            "duration": duration,
            "source_type": source_type,
            "language": language,
            "created_at": note.created_at.isoformat()
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n  [ERROR] Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if source_type == "video" and os.path.exists(audio_path) and audio_path != original_path:
            os.remove(audio_path)
