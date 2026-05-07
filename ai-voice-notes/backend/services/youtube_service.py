"""
YouTube audio download service using yt-dlp.
Downloads audio from any YouTube URL and returns the local file path.
Uses imageio-ffmpeg bundled binary — no system ffmpeg install needed.
"""

import os
import uuid
import re
import shutil
import yt_dlp

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


def _get_ffmpeg_path() -> str:
    """
    Get path to ffmpeg binary.
    Uses imageio-ffmpeg bundled binary if system ffmpeg not found.
    Returns the directory containing ffmpeg (yt-dlp needs the folder, not the exe).
    """
    # Try system ffmpeg first
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return os.path.dirname(system_ffmpeg)

    # Fall back to imageio-ffmpeg bundled binary
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)

        # yt-dlp looks for 'ffmpeg.exe' by name — ensure it exists
        plain = os.path.join(ffmpeg_dir, "ffmpeg.exe")
        if not os.path.exists(plain):
            shutil.copy2(ffmpeg_exe, plain)

        # Also ensure ffprobe exists (yt-dlp needs it too)
        ffprobe = os.path.join(ffmpeg_dir, "ffprobe.exe")
        if not os.path.exists(ffprobe):
            # Copy ffmpeg as ffprobe fallback
            shutil.copy2(ffmpeg_exe, ffprobe)

        print(f"[YT] Using bundled ffmpeg from: {ffmpeg_dir}")
        return ffmpeg_dir
    except Exception as e:
        print(f"[WARN] Could not find ffmpeg for yt-dlp: {e}")
        return None


def _get_ydl_opts(output_template: str) -> dict:
    """
    Build yt-dlp options.
    Downloads best audio WITHOUT ffmpeg postprocessing to avoid ffprobe issues.
    We handle conversion ourselves using FFmpegService after download.
    """
    opts = {
        # Download best audio format directly — no postprocessing needed
        'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
        'outtmpl': output_template,
        # NO postprocessors — skip ffmpeg conversion entirely
        'quiet': False,
        'no_warnings': True,
        'noplaylist': True,
        'max_filesize': 100 * 1024 * 1024,
    }

    ffmpeg_dir = _get_ffmpeg_path()
    if ffmpeg_dir:
        opts['ffmpeg_location'] = ffmpeg_dir

    return opts


def is_youtube_url(url: str) -> bool:
    """Check if a URL is a valid YouTube link."""
    patterns = [
        r'(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w\-]+',
        r'(https?://)?(music\.youtube\.com/watch\?v=)[\w\-]+',
    ]
    return any(re.search(p, url.strip()) for p in patterns)


def get_video_info(url: str) -> dict:
    """Fetch video title and duration without downloading."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    ffmpeg_dir = _get_ffmpeg_path()
    if ffmpeg_dir:
        ydl_opts['ffmpeg_location'] = ffmpeg_dir

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title', 'YouTube Video'),
            'duration': info.get('duration', 0),
            'channel': info.get('channel', ''),
            'thumbnail': info.get('thumbnail', ''),
        }


def download_audio(url: str) -> tuple[str, dict]:
    """
    Download audio from YouTube URL.
    Returns (audio_file_path, video_info_dict)
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    output_template = os.path.join(UPLOAD_DIR, f"{file_id}.%(ext)s")

    ydl_opts = _get_ydl_opts(output_template)

    print(f"[YT] Downloading: {url[:60]}...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_info = {
            'title': info.get('title', 'YouTube Video'),
            'duration': info.get('duration', 0),
            'channel': info.get('channel', ''),
            'thumbnail': info.get('thumbnail', ''),
        }
        # Get the actual downloaded filename from yt-dlp
        downloaded_ext = info.get('ext', 'webm')

    # Find the downloaded file
    downloaded_path = os.path.join(UPLOAD_DIR, f"{file_id}.{downloaded_ext}")

    # Also check common fallback extensions
    if not os.path.exists(downloaded_path):
        for ext in ['m4a', 'webm', 'opus', 'ogg', 'mp4', 'mp3']:
            alt = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
            if os.path.exists(alt):
                downloaded_path = alt
                downloaded_ext = ext
                break
        else:
            raise Exception("Audio download failed — file not found after download")

    print(f"[YT] Downloaded as .{downloaded_ext}: {video_info['title'][:50]}")

    # Convert to mp3 using our FFmpegService (handles any format)
    mp3_path = os.path.join(UPLOAD_DIR, f"{file_id}.mp3")

    if downloaded_ext != 'mp3':
        try:
            from services.ffmpeg_service import FFmpegService
            FFmpegService.extract_audio_from_video(downloaded_path, mp3_path)
            # Clean up original download
            if os.path.exists(downloaded_path) and downloaded_path != mp3_path:
                os.remove(downloaded_path)
            print(f"[YT] Converted to mp3")
        except Exception as e:
            print(f"[YT] Conversion failed, using original: {e}")
            mp3_path = downloaded_path

    return mp3_path, video_info
