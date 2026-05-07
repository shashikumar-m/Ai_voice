# 🎙️ AI Voice Notes

> Turn any audio, video or YouTube lecture into smart study notes — powered by local AI models. No API keys. No cloud. 100% private.

---

## ✨ Features

- 🎤 **Speech to Text** — OpenAI Whisper (small) running locally on CPU
- 🧠 **AI Summarization** — Fine-tuned T5-small model trained on CNN/DailyMail
- 🏷️ **Keyword Extraction** — NLP-based keyword detection
- 🃏 **Flashcards** — Auto-generated study cards
- ❓ **Practice Questions** — MCQ questions from lecture content
- 🧩 **Mind Map** — Visual topic structure
- 🎓 **Mock Exam** — Timed exam with scoring
- 📤 **Export** — PDF, Markdown, Text
- 🌐 **10+ Languages** — Hindi, Telugu, Tamil, English and more
- 🔇 **Noise Reduction** — Audio enhancement before transcription
- 🌙 **Dark / Light Mode** — Toggle in navbar

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, SQLAlchemy, SQLite |
| STT Model | OpenAI Whisper (small) — local CPU |
| NLP Model | Fine-tuned T5-small — trained by us |
| Audio | FFmpeg, noisereduce |
| Auth | JWT + bcrypt |

---

## 🚀 Setup & Run

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python main.py
```

Backend runs at: `http://localhost:8000`

### Frontend

```bash
cd website
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🤖 Train Your Own Model

```bash
cd backend
python train_summarizer.py
```

- Downloads CNN/DailyMail dataset (~500MB)
- Fine-tunes T5-small for 3 epochs on 2000 samples
- Takes ~1-2 hours on CPU
- Saves to `models/summarizer/`

> **Note:** Model binary files are excluded from Git (too large).  
> Run `train_summarizer.py` to generate them locally.

---

## 🌐 Network Access (Share with others on WiFi)

```bash
# Double-click this file:
start-network.bat
```

Shares the app on your local WiFi network automatically.

---

## 📁 Project Structure

```
ai-voice-notes/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── routes/              # API endpoints
│   ├── services/            # Whisper, T5, FFmpeg, Audio
│   ├── models/              # DB models + AI model files
│   └── train_summarizer.py  # Fine-tune T5-small
└── website/
    ├── src/
    │   ├── pages/           # React pages
    │   ├── components/      # Navbar, NoteCard
    │   ├── api/             # Axios client
    │   └── context/         # Theme context
    └── vite.config.js
```

---

## 👥 Built By

College project — AI-powered study assistant using local models.
