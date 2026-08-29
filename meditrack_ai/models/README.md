# Medical LLM Model Weights Directory

This directory stores local open-weight model files (e.g. `.gguf`, Hugging Face checkpoints, or quantized weights) referenced by `AI_MODEL_PATH` in `.env`.

## Compatible Open-Weight Model Candidates
- `Qwen2.5-1.5B-Instruct`
- `MedGemma-2B` (Quantized GGUF / HF)
- `TinyLlama-1.1B` / `Meditron-7B` (Quantized Q4_K_M)

## Usage Note
If model files are not placed in this folder, `LocalModelProvider` operates smoothly using the **Deterministic Safety Engine + Medical RAG Fallback System** without crashing the MediTrack application.
