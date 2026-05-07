import os
import subprocess


def _get_ffmpeg():
    """Return path to ffmpeg binary — uses imageio-ffmpeg bundled binary if system ffmpeg not found."""
    try:
        # Try system ffmpeg first
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return "ffmpeg", "ffprobe"
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # Fall back to imageio-ffmpeg bundled binary
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)

        # Ensure plain 'ffmpeg.exe' exists in that dir
        plain = os.path.join(ffmpeg_dir, "ffmpeg.exe")
        if not os.path.exists(plain):
            import shutil
            shutil.copy2(ffmpeg_exe, plain)

        # ffprobe is usually bundled alongside ffmpeg
        ffprobe = os.path.join(ffmpeg_dir, "ffprobe.exe")
        if not os.path.exists(ffprobe):
            ffprobe = plain  # fallback: use ffmpeg for probing too

        return plain, ffprobe
    except Exception:
        return "ffmpeg", "ffprobe"


class FFmpegService:
    @staticmethod
    def extract_audio_from_video(video_path: str, output_path: str) -> str:
        ffmpeg, _ = _get_ffmpeg()
        try:
            command = [
                ffmpeg, '-i', video_path,
                '-vn', '-acodec', 'libmp3lame',
                '-ab', '192k', '-ar', '44100',
                '-y', output_path
            ]
            subprocess.run(command, check=True, capture_output=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"FFmpeg extraction failed: {e.stderr.decode()}")
        except FileNotFoundError:
            raise Exception("FFmpeg not found. Please install ffmpeg.")

    @staticmethod
    def get_audio_duration(file_path: str) -> float:
        _, ffprobe = _get_ffmpeg()
        try:
            command = [
                ffprobe, '-v', 'quiet',
                '-show_entries', 'format=duration',
                '-of', 'csv=p=0', file_path
            ]
            result = subprocess.run(command, capture_output=True, text=True)
            return float(result.stdout.strip())
        except Exception:
            return 0.0
