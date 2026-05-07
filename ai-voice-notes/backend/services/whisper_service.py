"""
Local Whisper transcription service.
Uses openai-whisper running entirely on CPU - no API key needed.
Uses imageio-ffmpeg bundled binary so no system ffmpeg install needed.

Model: 'small' (244MB) — much better accuracy than 'base' for accented/fast speech.
"""

import whisper
import os
import traceback
from services.audio_enhancer import enhance_audio

DEVICE = "cpu"
_model = None

# 'small' is significantly more accurate than 'base' for real-world speech
# Change to 'medium' for even better accuracy (slower, ~1.5GB)
MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")


def _ensure_ffmpeg_in_path():
    """Add imageio-ffmpeg bundled binary directory to PATH so Whisper can find it."""
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
        if ffmpeg_dir not in os.environ.get("PATH", ""):
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

        ffmpeg_name = os.path.basename(ffmpeg_exe)
        if ffmpeg_name != "ffmpeg.exe" and ffmpeg_name != "ffmpeg":
            plain_path = os.path.join(ffmpeg_dir, "ffmpeg.exe")
            if not os.path.exists(plain_path):
                import shutil
                shutil.copy2(ffmpeg_exe, plain_path)
    except Exception as e:
        print(f"[WARN] Could not set up ffmpeg: {e}")


def get_model():
    global _model
    if _model is None:
        _ensure_ffmpeg_in_path()
        print(f"[...] Loading Whisper '{MODEL_SIZE}' model on CPU (first load ~45s)...")
        _model = whisper.load_model(MODEL_SIZE, device=DEVICE)
        print(f"[OK] Whisper '{MODEL_SIZE}' model loaded")
    return _model


def _detect_language(model, audio_path: str) -> str:
    """
    Auto-detect the language of the audio using Whisper's built-in detection.
    Returns language code like 'en', 'hi', 'te', etc.
    """
    try:
        audio = whisper.load_audio(audio_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        _, probs = model.detect_language(mel)
        detected = max(probs, key=probs.get)
        confidence = probs[detected]
        print(f"[LANG] Detected language: {detected} (confidence: {confidence:.1%})")
        return detected
    except Exception as e:
        print(f"[WARN] Language detection failed: {e}, defaulting to 'en'")
        return "en"


class WhisperService:
    def transcribe(self, audio_path: str, language: str = "en") -> str:
        try:
            _ensure_ffmpeg_in_path()
            model = get_model()

            # Step 1: Enhance audio (noise reduction + normalization)
            enhanced_path = enhance_audio(audio_path)
            is_enhanced = enhanced_path != audio_path

            try:
                # Step 2: Determine language
                # If user selected "auto" or we detect mismatch, auto-detect
                if language in ("auto", "", None):
                    lang = _detect_language(model, enhanced_path)
                else:
                    lang = language

                print(f"[MIC] Transcribing: {os.path.basename(audio_path)} (lang={lang})")

                # Step 3: Transcribe with improved settings
                result = model.transcribe(
                    enhanced_path,
                    language=lang,
                    fp16=False,           # CPU doesn't support fp16
                    verbose=False,
                    beam_size=5,          # More beams = more accurate (default is 5 for small)
                    best_of=5,            # Pick best of 5 candidates
                    temperature=0.0,      # Greedy — most deterministic/accurate
                    compression_ratio_threshold=2.4,  # Reject hallucinated repetitions
                    no_speech_threshold=0.6,          # Skip silent segments
                    condition_on_previous_text=True,  # Use context for better continuity
                    word_timestamps=False,
                    initial_prompt=_get_initial_prompt(lang),  # Guide the model
                )

            finally:
                # Clean up enhanced temp file
                if is_enhanced and os.path.exists(enhanced_path):
                    try:
                        os.remove(enhanced_path)
                    except Exception:
                        pass

            transcript = result.get("text", "").strip()

            # Post-process: clean up common Whisper artifacts
            transcript = _clean_transcript(transcript)

            print(f"[OK] Transcription done - {len(transcript)} chars")
            return transcript

        except Exception as e:
            print(f"[ERROR] Whisper transcription failed: {e}")
            traceback.print_exc()
            raise Exception(f"Transcription failed: {str(e)}")


def _get_initial_prompt(lang: str) -> str:
    """
    Give Whisper a hint about the content type.
    This significantly improves accuracy for lecture/educational content.
    """
    prompts = {
        "en": "This is an educational lecture or voice recording. The speaker discusses academic topics clearly.",
        "hi": "यह एक शैक्षिक व्याख्यान है।",
        "te": "ఇది ఒక విద్యా ఉపన్యాసం.",
        "ta": "இது ஒரு கல்வி விரிவுரை.",
        "kn": "ಇದು ಒಂದು ಶೈಕ್ಷಣಿಕ ಉಪನ್ಯಾಸ.",
        "ml": "ഇത് ഒരു വിദ്യാഭ്യാസ പ്രഭാഷണമാണ്.",
        "mr": "हे एक शैक्षणिक व्याख्यान आहे.",
        "bn": "এটি একটি শিক্ষামূলক বক্তৃতা।",
        "gu": "આ એક શૈક્ષણિક વ્યાખ્યાન છે.",
        "pa": "ਇਹ ਇੱਕ ਵਿਦਿਅਕ ਭਾਸ਼ਣ ਹੈ।",
    }
    return prompts.get(lang, prompts["en"])


def _clean_transcript(text: str) -> str:
    """
    Remove common Whisper hallucination artifacts.
    Whisper sometimes repeats phrases or adds filler text.
    """
    if not text:
        return text

    # Remove repeated phrases (Whisper hallucination)
    lines = text.split(". ")
    seen = set()
    cleaned = []
    for line in lines:
        normalized = line.strip().lower()
        if normalized and normalized not in seen:
            seen.add(normalized)
            cleaned.append(line.strip())

    result = ". ".join(cleaned)

    # Remove common Whisper filler hallucinations
    fillers = [
        "Thank you for watching.",
        "Thanks for watching.",
        "Please subscribe.",
        "Like and subscribe.",
        "Thank you.",
        "[Music]",
        "[Applause]",
        "(Music)",
    ]
    for filler in fillers:
        result = result.replace(filler, "").strip()

    return result
