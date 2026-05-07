# -*- coding: utf-8 -*-
"""
Fine-tune T5-small for text summarization on CNN/DailyMail dataset.
Runs on CPU - uses a small subset (2000 samples) to keep training time ~1-2 hours.

Usage:
    python train_summarizer.py

Output:
    ./models/summarizer/   -- saved fine-tuned model
"""

import os
import torch
from transformers import (
    T5ForConditionalGeneration,
    T5Tokenizer,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq,
)
from datasets import load_dataset

# Config
BASE_MODEL = "t5-small"
OUTPUT_DIR = "./models/summarizer"
MAX_INPUT_LEN = 512
MAX_TARGET_LEN = 128
TRAIN_SAMPLES = 2000
EVAL_SAMPLES = 200
BATCH_SIZE = 4
EPOCHS = 3
LR = 3e-4

print("=" * 60)
print("  Fine-tuning T5-small for Summarization")
print(f"  Base model : {BASE_MODEL}")
print(f"  Train size : {TRAIN_SAMPLES} samples")
print(f"  Device     : CPU")
print("=" * 60)

# Load tokenizer & model
print("\n[...] Loading tokenizer and model...")
tokenizer = T5Tokenizer.from_pretrained(BASE_MODEL)
model = T5ForConditionalGeneration.from_pretrained(BASE_MODEL)
print(f"[OK] Model loaded -- {sum(p.numel() for p in model.parameters()):,} parameters")

# Load dataset
print("\n[...] Loading CNN/DailyMail dataset (first time downloads ~500MB)...")
dataset = load_dataset("cnn_dailymail", "3.0.0")

train_data = dataset["train"].select(range(TRAIN_SAMPLES))
eval_data = dataset["validation"].select(range(EVAL_SAMPLES))
print(f"[OK] Dataset loaded -- {len(train_data)} train, {len(eval_data)} eval samples")

# Preprocessing
def preprocess(examples):
    inputs = ["summarize: " + doc for doc in examples["article"]]
    targets = examples["highlights"]

    model_inputs = tokenizer(
        inputs,
        max_length=MAX_INPUT_LEN,
        truncation=True,
        padding="max_length",
    )
    labels = tokenizer(
        targets,
        max_length=MAX_TARGET_LEN,
        truncation=True,
        padding="max_length",
    )

    label_ids = [
        [(l if l != tokenizer.pad_token_id else -100) for l in label]
        for label in labels["input_ids"]
    ]
    model_inputs["labels"] = label_ids
    return model_inputs

print("\n[...] Tokenizing dataset...")
train_tokenized = train_data.map(preprocess, batched=True, remove_columns=train_data.column_names)
eval_tokenized = eval_data.map(preprocess, batched=True, remove_columns=eval_data.column_names)
print("[OK] Tokenization done")

# Training args
training_args = Seq2SeqTrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    learning_rate=LR,
    warmup_steps=100,
    weight_decay=0.01,
    logging_steps=50,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    predict_with_generate=True,
    fp16=False,
    use_cpu=True,
    report_to="none",
    save_total_limit=1,
)

data_collator = DataCollatorForSeq2Seq(tokenizer, model=model, padding=True)

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=train_tokenized,
    eval_dataset=eval_tokenized,
    processing_class=tokenizer,
    data_collator=data_collator,
)

# Train
print(f"\n[>>] Starting training ({EPOCHS} epochs x {TRAIN_SAMPLES} samples)...")
print("     This will take ~1-2 hours on CPU. Go grab a coffee!\n")

trainer.train()

# Save
print(f"\n[SAVE] Saving fine-tuned model to {OUTPUT_DIR}...")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("\n" + "=" * 60)
print("  [OK] Training complete!")
print(f"  Model saved to: {OUTPUT_DIR}")
print("=" * 60)
