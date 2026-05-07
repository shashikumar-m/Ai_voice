"""
Translation API — translates note content into any supported language.
Uses Google Translate (free, via deep-translator) — no API key needed.

Endpoint:
  POST /api/notes/{id}/translate
  Body: { "target_language": "hi", "fields": ["summary", "transcript"] }
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from models.database import get_db, Note
from deep_translator import GoogleTranslator

router = APIRouter()

# All supported Indian + international languages
SUPPORTED_LANGUAGES = {
    # Indian Languages
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "sa": "Sanskrit",
    # International
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh-CN": "Chinese (Simplified)",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "ru": "Russian",
    "pt": "Portuguese",
    "it": "Italian",
}

# Google Translate has a 5000 char limit per request — we chunk longer texts
MAX_CHUNK_SIZE = 4500


def _translate_text(text: str, target: str) -> str:
    """Translate text to target language, handling long texts by chunking."""
    if not text or not text.strip():
        return text

    # Split into chunks if text is too long
    if len(text) <= MAX_CHUNK_SIZE:
        return GoogleTranslator(source="auto", target=target).translate(text)

    # Chunk by sentences to preserve meaning
    sentences = text.replace("\n", " \n ").split(". ")
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) < MAX_CHUNK_SIZE:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "

    if current_chunk:
        chunks.append(current_chunk.strip())

    # Translate each chunk
    translated_parts = []
    for chunk in chunks:
        if chunk.strip():
            translated = GoogleTranslator(source="auto", target=target).translate(chunk)
            translated_parts.append(translated)

    return " ".join(translated_parts)


class TranslateRequest(BaseModel):
    target_language: str
    fields: List[str] = ["summary", "keywords"]  # which fields to translate


@router.get("/translate/languages")
async def get_languages():
    """Return all supported translation languages."""
    indian = {k: v for k, v in SUPPORTED_LANGUAGES.items()
              if k in ["hi","te","ta","kn","ml","mr","bn","gu","pa","or","as","ur","sa"]}
    other = {k: v for k, v in SUPPORTED_LANGUAGES.items() if k not in indian}
    return {
        "success": True,
        "indian_languages": indian,
        "other_languages": other,
        "all": SUPPORTED_LANGUAGES,
    }


@router.post("/notes/{note_id}/translate")
async def translate_note(
    note_id: int,
    body: TranslateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Translate selected fields of a note into the target language."""

    if body.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{body.target_language}'. "
                   f"Supported: {list(SUPPORTED_LANGUAGES.keys())}"
        )

    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    target = body.target_language
    lang_name = SUPPORTED_LANGUAGES[target]
    translated = {}

    try:
        if "title" in body.fields and note.title:
            translated["title"] = _translate_text(note.title, target)

        if "summary" in body.fields and note.summary:
            translated["summary"] = _translate_text(note.summary, target)

        if "transcript" in body.fields and note.transcript:
            translated["transcript"] = _translate_text(note.transcript, target)

        if "keywords" in body.fields and note.keywords:
            translated["keywords"] = [
                _translate_text(kw, target) for kw in note.keywords
            ]

        return {
            "success": True,
            "note_id": note_id,
            "target_language": target,
            "language_name": lang_name,
            "translated": translated,
            "original": {
                "title": note.title,
                "summary": note.summary,
                "keywords": note.keywords,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )
