"""
GroqService - uses LOCAL models:
  - Transcription : openai-whisper (local, CPU)
  - Summarization : fine-tuned T5-small (local, CPU)
  - Keywords      : fine-tuned T5-small (local, CPU)

All heavy CPU work runs in a thread pool so the server stays
responsive to other requests (login, notes, etc.) during processing.
"""

import asyncio
from functools import partial
from services.whisper_service import WhisperService
from services.summarizer_service import SummarizerService

_whisper = None
_summarizer = None


def get_whisper():
    global _whisper
    if _whisper is None:
        _whisper = WhisperService()
    return _whisper


def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = SummarizerService()
    return _summarizer


async def _run_in_thread(func, *args):
    """Run a blocking CPU function in a thread pool so FastAPI stays responsive."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, func, *args)


class GroqService:

    async def transcribe_audio(self, audio_file_path: str, language: str = "en") -> str:
        try:
            whisper_svc = get_whisper()
            # Run blocking Whisper in thread pool — server stays responsive
            return await _run_in_thread(whisper_svc.transcribe, audio_file_path, language)
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")

    async def summarize_text(self, text: str) -> str:
        try:
            summarizer = get_summarizer()
            return await _run_in_thread(summarizer.summarize, text)
        except Exception as e:
            raise Exception(f"Summarization failed: {str(e)}")

    async def extract_keywords(self, text: str) -> list:
        try:
            summarizer = get_summarizer()
            return await _run_in_thread(summarizer.extract_keywords, text)
        except Exception as e:
            raise Exception(f"Keyword extraction failed: {str(e)}")
