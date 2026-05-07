import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from models.database import get_db, Note
from routes.auth import get_current_user, get_user_id
from services.groq_service import GroqService
from services.youtube_service import download_audio, get_video_info, is_youtube_url

router = APIRouter()


class YouTubeRequest(BaseModel):
    url: str
    language: str = "en"
    title: str = ""


@router.post("/youtube")
async def process_youtube(body: YouTubeRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Accept a YouTube URL, download audio, transcribe and summarize it.
    """
    url = body.url.strip()

    if not is_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.")

    audio_path = None
    try:
        # Download audio from YouTube
        audio_path, video_info = download_audio(url)

        duration = float(video_info.get('duration') or 0)
        auto_title = body.title.strip() or video_info.get('title', 'YouTube Video')

        # Transcribe
        groq = GroqService()
        transcript = await groq.transcribe_audio(audio_path, body.language)

        if not transcript or len(transcript.strip()) < 10:
            raise HTTPException(status_code=422, detail="Could not extract speech from this video. It may have no audio or be music-only.")

        # Summarize + keywords
        summary = await groq.summarize_text(transcript)
        keywords = await groq.extract_keywords(transcript)

        # Save note
        note = Note(
            user_id=get_user_id(current_user),
            title=auto_title,
            transcript=transcript,
            summary=summary,
            keywords=keywords,
            source_type="youtube",
            language=body.language,
            duration=duration,
            file_path=audio_path,
        )
        db.add(note)
        await db.commit()
        await db.refresh(note)

        return JSONResponse({
            "success": True,
            "note_id": note.id,
            "title": note.title,
            "transcript": transcript,
            "summary": summary,
            "keywords": keywords,
            "duration": duration,
            "source_type": "youtube",
            "language": body.language,
            "created_at": note.created_at.isoformat(),
            "video_info": {
                "channel": video_info.get('channel', ''),
                "thumbnail": video_info.get('thumbnail', ''),
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube processing failed: {str(e)}")


@router.get("/youtube/info")
async def get_youtube_info(url: str):
    """
    Preview YouTube video info before processing (title, duration, channel).
    """
    if not is_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    try:
        info = get_video_info(url)
        return {"success": True, **info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch video info: {str(e)}")
