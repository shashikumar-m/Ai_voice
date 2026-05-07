# AI Voice Notes Summarizer — Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ installed
- Flutter 3.0+ installed
- ffmpeg installed (for video audio extraction)
- Groq API key (free at https://console.groq.com)

---

## Step 1: Backend Setup

### 1.1 Install Python Dependencies

```bash
cd backend

# Windows
setup.bat

# Or manually:
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

### 1.2 Configure Environment

```bash
copy .env.example .env
```

Edit `.env` file:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./voice_notes.db
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=100
```

**Get your Groq API key:**
1. Go to https://console.groq.com
2. Sign up (free)
3. Create an API key
4. Copy and paste into `.env`

### 1.3 Install ffmpeg (Required for Video Support)

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 1.4 Start Backend

```bash
# Windows
start.bat

# Or manually:
venv\Scripts\activate
python main.py
```

Backend will run at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

## Step 2: Flutter App Setup

### 2.1 Install Dependencies

```bash
cd flutter_app
flutter pub get
```

### 2.2 Configure API URL

Edit `lib/utils/constants.dart`:

```dart
// For local development
static const String baseUrl = 'http://localhost:8000/api';
static const String wsUrl = 'ws://localhost:8000/api';

// For Android emulator
static const String baseUrl = 'http://10.0.2.2:8000/api';
static const String wsUrl = 'ws://10.0.2.2:8000/api';

// For physical device (use your computer's IP)
static const String baseUrl = 'http://192.168.1.100:8000/api';
static const String wsUrl = 'ws://192.168.1.100:8000/api';
```

**Find your computer's IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### 2.3 Run the App

```bash
# Web
flutter run -d chrome

# Android (with device/emulator connected)
flutter run

# iOS (Mac only)
flutter run -d ios

# Windows desktop
flutter run -d windows
```

---

## Step 3: Test the System

### 3.1 Test Backend

Open http://localhost:8000/docs in your browser. You should see the FastAPI interactive docs.

### 3.2 Test Upload

1. Open the Flutter app
2. Tap "Upload Audio/Video"
3. Select a test audio file (MP3, WAV, etc.)
4. Tap "Process Recording"
5. Wait for transcription and summary

### 3.3 Test Live Meeting

1. Tap "Live Meeting"
2. Grant microphone permission
3. Tap "Start Live Meeting"
4. Speak for 30+ seconds
5. Tap "End Meeting"
6. View generated summary

---

## Troubleshooting

### Backend Issues

**Error: "GROQ_API_KEY not found"**
- Make sure `.env` file exists in `backend/` folder
- Check that `GROQ_API_KEY=` has your actual key

**Error: "ffmpeg not found"**
- Install ffmpeg (see Step 1.3)
- Restart terminal after installation

**Error: "Port 8000 already in use"**
- Stop other processes using port 8000
- Or change port in `main.py`: `uvicorn.run("main:app", port=8001)`

### Flutter Issues

**Error: "Connection refused"**
- Make sure backend is running
- Check API URL in `constants.dart`
- For Android emulator, use `10.0.2.2` instead of `localhost`

**Error: "Microphone permission denied"**
- Android: Check `AndroidManifest.xml` has `RECORD_AUDIO` permission
- iOS: Add microphone permission to `Info.plist`

**Error: "Package not found"**
- Run `flutter pub get` again
- Run `flutter clean` then `flutter pub get`

---

## Production Deployment

### Switch to Supabase (Recommended)

1. Create Supabase project at https://supabase.com
2. Reset your database password
3. Update `.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_KEY=your_anon_key
```
4. Install asyncpg: `pip install asyncpg`

### Deploy Backend

**Options:**
- Railway.app (easiest)
- Render.com
- AWS EC2
- Google Cloud Run
- Heroku

### Deploy Flutter App

**Web:**
```bash
flutter build web
# Upload `build/web/` to Netlify, Vercel, or Firebase Hosting
```

**Android:**
```bash
flutter build apk --release
# Upload to Google Play Store
```

**iOS:**
```bash
flutter build ios --release
# Upload to App Store via Xcode
```

---

## Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Audio Upload | ✅ | MP3, WAV, M4A, OGG, FLAC |
| Video Upload | ✅ | MP4, MOV, AVI, MKV (auto audio extraction) |
| Live Meeting | ✅ | Real-time transcription via WebSocket |
| AI Summary | ✅ | Groq LLaMA 3.3 70B |
| Keyword Extraction | ✅ | Automatic topic identification |
| Multi-language | ✅ | 10+ languages via Whisper |
| Search Notes | ✅ | Full-text search |
| PDF Export | ✅ | Formatted PDF generation |
| Share Notes | ✅ | Share as text |
| Dark Mode | ✅ | Auto system theme |

---

## API Usage Examples

### Upload Audio

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@recording.mp3" \
  -F "language=en" \
  -F "title=My Note"
```

### Get All Notes

```bash
curl http://localhost:8000/api/notes?search=physics&limit=10
```

### Export PDF

```bash
curl http://localhost:8000/api/notes/1/export/pdf --output note.pdf
```

---

## Support

For issues or questions:
1. Check this guide first
2. Review backend logs in terminal
3. Check Flutter console for errors
4. Verify Groq API key is valid

---

## Next Steps

- Add user authentication (Supabase Auth)
- Implement note sharing via links
- Add audio playback in app
- Support more languages
- Add note editing
- Implement folders/tags
