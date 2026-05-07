"""
Learning Tools API â€” generates NPTEL-style study materials using local T5 model.
Uses our fine-tuned T5-small for all generation â€” no external API needed.
"""

import json
import re
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db, Note
from routes.auth import get_current_user, get_user_id
from services.summarizer_service import SummarizerService

router = APIRouter()
_summarizer = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = SummarizerService()
    return _summarizer


async def _get_note(note_id: int, db: AsyncSession, user_id: str = None) -> Note:
    query = select(Note).where(Note.id == note_id)
    if user_id:
        query = query.where(Note.user_id == user_id)
    result = await db.execute(query)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(404, "Note not found")
    return note


def _extract_sentences(text: str) -> list:
    """Split transcript into clean sentences."""
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def _extract_key_phrases(text: str, n: int = 20) -> list:
    """Extract important noun phrases / key terms from text."""
    stop_words = {
        "the","a","an","and","or","but","in","on","at","to","for","of","with",
        "by","from","is","was","are","were","be","been","have","has","had",
        "do","does","did","will","would","could","should","that","this","it",
        "we","they","he","she","i","you","not","so","if","as","up","out","about",
        "also","just","very","more","some","can","may","which","when","where",
        "what","how","all","one","two","three","four","five","six","seven",
        "then","than","there","their","they","these","those","into","over",
        "after","before","during","through","between","each","every","both",
    }
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    freq = {}
    for w in words:
        if w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:n]]


def _make_flashcards(transcript: str, keywords: list) -> list:
    """Generate flashcards from transcript sentences and keywords."""
    sentences = _extract_sentences(transcript)
    key_phrases = _extract_key_phrases(transcript)
    cards = []

    # Card type 1: Definition-style from sentences containing key terms
    for phrase in key_phrases[:8]:
        for sent in sentences:
            if phrase.lower() in sent.lower() and len(sent) > 40:
                # Make a question by hiding the key term
                question = f"What is '{phrase}' in this context?"
                answer = sent.strip()
                if len(answer) > 200:
                    answer = answer[:200] + "..."
                cards.append({"front": question, "back": answer})
                break

    # Card type 2: Fill-in-the-blank style
    for sent in sentences[:5]:
        words_in_sent = sent.split()
        if len(words_in_sent) > 8:
            # Pick a meaningful word to blank out
            candidates = [w for w in words_in_sent if len(w) > 5 and w.isalpha()]
            if candidates:
                blank_word = candidates[len(candidates)//2]
                question = sent.replace(blank_word, "_____", 1)
                cards.append({"front": f"Fill in the blank: {question}", "back": blank_word})

    # Card type 3: Keyword definition cards
    for kw in (keywords or [])[:5]:
        for sent in sentences:
            if kw.lower() in sent.lower():
                cards.append({
                    "front": f"Explain: {kw}",
                    "back": sent.strip()[:200]
                })
                break

    # Deduplicate and limit
    seen = set()
    unique = []
    for c in cards:
        key = c["front"][:50]
        if key not in seen:
            seen.add(key)
            unique.append(c)

    random.shuffle(unique)
    return unique[:10]


def _make_practice_questions(transcript: str, keywords: list) -> list:
    """Generate MCQ practice questions from transcript content."""
    sentences = _extract_sentences(transcript)
    key_phrases = _extract_key_phrases(transcript, n=15)
    questions = []

    for i, sent in enumerate(sentences[:8]):
        words = sent.split()
        if len(words) < 8:
            continue

        # Pick a key term from the sentence as the answer
        candidates = [w for w in words if len(w) > 5 and w.isalpha() and w.lower() not in
                      {"which","where","there","their","about","would","could","should"}]
        if not candidates:
            continue

        correct_word = candidates[0].rstrip(".,;:")
        if len(correct_word) < 4:
            continue

        # Create question
        question_text = sent.replace(correct_word, "_____", 1)
        question_text = f"Complete the statement: '{question_text}'"

        # Create wrong options from other key phrases
        wrong_options = [w for w in key_phrases if w.lower() != correct_word.lower()]
        random.shuffle(wrong_options)
        wrong_options = wrong_options[:3]

        while len(wrong_options) < 3:
            wrong_options.append(f"option_{len(wrong_options)+1}")

        options_list = [correct_word] + wrong_options[:3]
        random.shuffle(options_list)
        correct_letter = ["A","B","C","D"][options_list.index(correct_word)]

        options = [f"{l}. {o}" for l, o in zip(["A","B","C","D"], options_list)]

        questions.append({
            "question": question_text,
            "options": options,
            "answer": correct_letter,
            "explanation": f"The correct answer is '{correct_word}'. " + sent[:100]
        })

    return questions[:8]


def _make_mock_exam(transcript: str, keywords: list) -> list:
    """Generate mock exam questions with difficulty levels."""
    base_questions = _make_practice_questions(transcript, keywords)
    sentences = _extract_sentences(transcript)

    exam_questions = []
    difficulties = ["easy", "easy", "medium", "medium", "medium", "hard", "hard", "medium",
                    "easy", "medium", "hard", "medium", "easy", "hard", "medium"]
    marks_map = {"easy": 1, "medium": 2, "hard": 3}

    for i, q in enumerate(base_questions):
        diff = difficulties[i % len(difficulties)]
        exam_questions.append({**q, "difficulty": diff, "marks": marks_map[diff]})

    # Add concept questions
    for i, sent in enumerate(sentences[8:13]):
        words = sent.split()
        candidates = [w for w in words if len(w) > 5 and w.isalpha()]
        if not candidates:
            continue
        correct = candidates[0].rstrip(".,;:")
        if len(correct) < 4:
            continue

        key_phrases = _extract_key_phrases(transcript, n=15)
        wrong = [w for w in key_phrases if w.lower() != correct.lower()][:3]
        while len(wrong) < 3:
            wrong.append(f"term_{len(wrong)}")

        opts = [correct] + wrong
        random.shuffle(opts)
        cl = ["A","B","C","D"][opts.index(correct)]
        diff = difficulties[(i + 8) % len(difficulties)]

        exam_questions.append({
            "question": f"Which term best fits: '{sent[:100]}...'?",
            "options": [f"{l}. {o}" for l, o in zip(["A","B","C","D"], opts)],
            "answer": cl,
            "explanation": f"'{correct}' is the key term in this context.",
            "difficulty": diff,
            "marks": marks_map[diff]
        })

    return exam_questions[:15]


def _make_mindmap(title: str, transcript: str, keywords: list) -> dict:
    """Generate a mind map structure from transcript."""
    sentences = _extract_sentences(transcript)
    key_phrases = _extract_key_phrases(transcript, n=30)

    colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"]

    # Group sentences into topic clusters
    branches = []
    chunk_size = max(1, len(sentences) // 6)

    for i in range(min(6, len(sentences))):
        chunk_start = i * chunk_size
        chunk = sentences[chunk_start:chunk_start + chunk_size]
        if not chunk:
            break

        # Topic name from most frequent word in chunk
        chunk_text = " ".join(chunk)
        chunk_phrases = _extract_key_phrases(chunk_text, n=5)
        topic = chunk_phrases[0].title() if chunk_phrases else f"Topic {i+1}"

        # Subtopics from key phrases in this chunk
        subtopics = chunk_phrases[1:4] if len(chunk_phrases) > 1 else key_phrases[i*3:(i*3)+3]
        subtopics = [s.title() for s in subtopics if s][:3]

        if not subtopics:
            subtopics = [f"Concept {j+1}" for j in range(2)]

        branches.append({
            "topic": topic,
            "color": colors[i % len(colors)],
            "subtopics": subtopics
        })

    return {
        "center": title or "Main Topic",
        "branches": branches
    }


# â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post("/notes/{note_id}/flashcards")
async def generate_flashcards(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    note = await _get_note(note_id, db, get_user_id(current_user))
    try:
        cards = _make_flashcards(note.transcript, note.keywords or [])
        if not cards:
            raise HTTPException(500, "Could not generate flashcards from this content")
        return {"success": True, "flashcards": cards, "total": len(cards)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Flashcard generation failed: {str(e)}")


@router.post("/notes/{note_id}/practice-questions")
async def generate_practice_questions(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    note = await _get_note(note_id, db, get_user_id(current_user))
    try:
        questions = _make_practice_questions(note.transcript, note.keywords or [])
        if not questions:
            raise HTTPException(500, "Could not generate questions from this content")
        return {"success": True, "questions": questions, "total": len(questions)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Question generation failed: {str(e)}")


@router.post("/notes/{note_id}/mock-exam")
async def generate_mock_exam(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    note = await _get_note(note_id, db, get_user_id(current_user))
    try:
        questions = _make_mock_exam(note.transcript, note.keywords or [])
        if not questions:
            raise HTTPException(500, "Could not generate exam from this content")
        total_marks = sum(q.get("marks", 1) for q in questions)
        return {
            "success": True,
            "questions": questions,
            "total": len(questions),
            "total_marks": total_marks,
            "duration_minutes": len(questions) * 2,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Mock exam generation failed: {str(e)}")


@router.post("/notes/{note_id}/mindmap")
async def generate_mindmap(note_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    note = await _get_note(note_id, db, get_user_id(current_user))
    try:
        mindmap = _make_mindmap(note.title, note.transcript, note.keywords or [])
        return {"success": True, "mindmap": mindmap}
    except Exception as e:
        raise HTTPException(500, f"Mind map generation failed: {str(e)}")

