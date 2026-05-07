"""
Audio Enhancement Service
Cleans up audio before sending to Whisper for better transcription accuracy.

Pipeline:
  1. Load audio via soundfile (handles mp3/wav/m4a via ffmpeg)
  2. Convert to mono (single channel)
  3. Normalize volume (so quiet recordings are audible)
  4. Noise reduction (removes background hiss, fan noise, static)
  5. Save cleaned audio as WAV for Whisper

This runs automatically before every transcription.
"""

import os
import numpy as np
import soundfile as sf
import noisereduce as nr
import subprocess
import tempfile
import traceback


def _load_audio_via_ffmpeg(input_path: str, sample_rate: int = 16000) -> np.ndarray:
    """
    Use ffmpeg to decode any audio format to raw PCM float32.
    Returns numpy array of shape (samples,) — mono, normalized to [-1, 1].
    """
    # Find ffmpeg binary (use imageio-ffmpeg if system ffmpeg not available)
    ffmpeg_bin = "ffmpeg"
    try:
        subprocess.run([ffmpeg_bin, "-version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
            # Ensure plain ffmpeg.exe exists
            ffmpeg_dir = os.path.dirname(ffmpeg_bin)
            plain = os.path.join(ffmpeg_dir, "ffmpeg.exe")
            if not os.path.exists(plain):
                import shutil
                shutil.copy2(ffmpeg_bin, plain)
            ffmpeg_bin = plain
        except Exception:
            raise RuntimeError("ffmpeg not found. Cannot load audio.")

    cmd = [
        ffmpeg_bin,
        "-i", input_path,
        "-f", "f32le",          # raw 32-bit float PCM
        "-acodec", "pcm_f32le",
        "-ar", str(sample_rate), # resample to target rate
        "-ac", "1",              # mono
        "-",                     # output to stdout
    ]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg decode failed: {result.stderr.decode()[:200]}")

    audio = np.frombuffer(result.stdout, dtype=np.float32).copy()
    return audio


def _normalize_volume(audio: np.ndarray, target_db: float = -20.0) -> np.ndarray:
    """
    Normalize audio to a target RMS level in dB.
    Prevents clipping by capping at ±1.0.
    """
    rms = np.sqrt(np.mean(audio ** 2))
    if rms < 1e-9:
        return audio  # silence — don't touch

    target_rms = 10 ** (target_db / 20.0)
    gain = target_rms / rms
    # Cap gain to avoid over-amplifying very quiet noise
    gain = min(gain, 10.0)
    audio = audio * gain
    # Clip to prevent distortion
    audio = np.clip(audio, -1.0, 1.0)
    return audio


def _reduce_noise(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """
    Apply spectral noise reduction.
    Uses the first 0.5 seconds as a noise profile (assumes it's background noise).
    Falls back gracefully if noise reduction fails.
    """
    try:
        # Use first 0.5s as noise sample (background before speech starts)
        noise_sample_len = int(0.5 * sample_rate)
        noise_clip = audio[:noise_sample_len] if len(audio) > noise_sample_len else audio

        reduced = nr.reduce_noise(
            y=audio,
            sr=sample_rate,
            y_noise=noise_clip,
            prop_decrease=0.75,   # reduce noise by 75% — aggressive but keeps speech
            stationary=False,     # non-stationary: handles varying background noise
            n_fft=1024,
            n_jobs=1,
        )
        return reduced.astype(np.float32)
    except Exception as e:
        print(f"[WARN] Noise reduction failed, using original audio: {e}")
        return audio


def enhance_audio(input_path: str) -> str:
    """
    Main entry point. Takes any audio file path, returns path to enhanced WAV.
    The enhanced file is saved as a temp file — caller is responsible for cleanup.

    Returns:
        str: path to enhanced WAV file
    """
    SAMPLE_RATE = 16000  # Whisper works best at 16kHz

    print(f"[ENHANCE] Processing: {os.path.basename(input_path)}")

    try:
        # Step 1: Load audio
        audio = _load_audio_via_ffmpeg(input_path, sample_rate=SAMPLE_RATE)
        print(f"[ENHANCE] Loaded {len(audio)/SAMPLE_RATE:.1f}s of audio")

        if len(audio) == 0:
            raise ValueError("Audio file appears to be empty")

        # Step 2: Normalize volume
        audio = _normalize_volume(audio, target_db=-20.0)
        print(f"[ENHANCE] Volume normalized")

        # Step 3: Noise reduction
        audio = _reduce_noise(audio, SAMPLE_RATE)
        print(f"[ENHANCE] Noise reduction applied")

        # Step 4: Save enhanced audio as WAV
        tmp = tempfile.NamedTemporaryFile(
            suffix="_enhanced.wav",
            delete=False,
            dir=os.path.dirname(input_path) or "uploads"
        )
        tmp.close()

        sf.write(tmp.name, audio, SAMPLE_RATE, subtype="PCM_16")
        print(f"[ENHANCE] Saved enhanced audio: {os.path.basename(tmp.name)}")

        return tmp.name

    except Exception as e:
        print(f"[ENHANCE] Enhancement failed, using original: {e}")
        traceback.print_exc()
        return input_path  # fallback: use original file unchanged
