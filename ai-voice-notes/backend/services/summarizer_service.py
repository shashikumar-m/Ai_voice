"""
Summarization + keyword extraction using fine-tuned T5-small.
Falls back to base T5-small if fine-tuned model is not ready yet.
"""

import os
import re
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer

DEVICE = "cpu"
FINETUNED_MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/summarizer")
FALLBACK_MODEL = "t5-small"

MAX_INPUT_LEN = 512
MAX_SUMMARY_LEN = 200
MAX_KEYWORD_LEN = 80

_model = None
_tokenizer = None


def _is_model_ready(path: str) -> bool:
    """Check the fine-tuned model folder has all required files (training complete)."""
    required = ["config.json", "tokenizer_config.json"]
    has_weights = (
        os.path.exists(os.path.join(path, "model.safetensors")) or
        os.path.exists(os.path.join(path, "pytorch_model.bin"))
    )
    has_config = all(os.path.exists(os.path.join(path, f)) for f in required)
    return has_config and has_weights


def get_model():
    global _model, _tokenizer

    if _model is not None:
        return _model, _tokenizer

    # Use fine-tuned model only if fully saved, otherwise fall back to base t5-small
    if os.path.isdir(FINETUNED_MODEL_PATH) and _is_model_ready(FINETUNED_MODEL_PATH):
        model_path = FINETUNED_MODEL_PATH
        print(f"[OK] Loading fine-tuned summarizer from {model_path}")
    else:
        model_path = FALLBACK_MODEL
        print(f"[WARN] Fine-tuned model not ready yet. Using base '{FALLBACK_MODEL}'.")
        print(f"       Training still running - will auto-switch once complete.")

    print("[...] Loading summarizer model (first load ~20s)...")
    _tokenizer = T5Tokenizer.from_pretrained(model_path)
    _model = T5ForConditionalGeneration.from_pretrained(model_path)
    _model.eval()
    print("[OK] Summarizer model loaded")

    return _model, _tokenizer


class SummarizerService:
    def summarize(self, text: str) -> str:
        model, tokenizer = get_model()
        truncated = text[:2000]
        input_text = "summarize: " + truncated

        inputs = tokenizer(
            input_text,
            return_tensors="pt",
            max_length=MAX_INPUT_LEN,
            truncation=True,
        )

        with torch.no_grad():
            output_ids = model.generate(
                inputs["input_ids"],
                max_new_tokens=MAX_SUMMARY_LEN,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3,
                length_penalty=1.5,
            )

        raw = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', raw) if s.strip()]
        return "\n".join(f"* {s}" for s in sentences) if sentences else f"* {raw}"

    def extract_keywords(self, text: str) -> list:
        model, tokenizer = get_model()
        truncated = text[:1000]
        input_text = "extract keywords: " + truncated

        inputs = tokenizer(
            input_text,
            return_tensors="pt",
            max_length=MAX_INPUT_LEN,
            truncation=True,
        )

        with torch.no_grad():
            output_ids = model.generate(
                inputs["input_ids"],
                max_new_tokens=MAX_KEYWORD_LEN,
                num_beams=2,
                early_stopping=True,
            )

        raw = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
        keywords = [k.strip() for k in raw.split(",") if k.strip()]

        if len(keywords) < 3:
            keywords = self._fallback_keywords(text)

        return keywords[:10]

    def _fallback_keywords(self, text: str) -> list:
        stop_words = {
            "the","a","an","and","or","but","in","on","at","to","for","of","with",
            "by","from","is","was","are","were","be","been","have","has","had",
            "do","does","did","will","would","could","should","that","this","it",
            "we","they","he","she","i","you","not","so","if","as","up","out",
        }
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        freq = {}
        for w in words:
            if w not in stop_words:
                freq[w] = freq.get(w, 0) + 1
        return [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]]
