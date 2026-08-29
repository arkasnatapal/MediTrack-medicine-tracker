# MediTrack AI — Digital Triage Engine

The **MediTrack AI Digital Triage Engine** is a self-hosted, safety-first clinical triage and care-navigation system built using FastAPI, PyTorch/Transformers abstractions, a Medical RAG pipeline, and a **Deterministic Safety Engine**.

## Architecture Philosophy
- **AI UNDERSTANDS**: Natural language symptom extraction converts free-text input into structured clinical parameters.
- **SAFETY ENGINE PROTECTS**: The deterministic safety engine has absolute top priority over LLM recommendations to instantly trigger emergency routing for red-flag symptoms.
- **MEDICAL KNOWLEDGE INFORMS**: Retrieval-Augmented Generation (RAG) fetches verified clinical evidence from WHO and MoHFW guidelines.
- **MEDITRACK NETWORK CONNECTS**: Maps triage decisions (`EMERGENCY`, `URGENT`, `ROUTINE`) to nearby public healthcare facilities (PHC, CHC, District Hospital) and emergency service providers (108/112).

## Hardware Detection
Upon startup, the system inspects host machine resources:
- OS & CPU cores
- RAM capacity
- GPU & CUDA availability (e.g. NVIDIA RTX 4050 6GB VRAM)
- Recommends compatible quantized open-weight model size (e.g. `Qwen2.5-1.5B-Instruct` or `MedGemma-2B`).

## Local Development & Setup

### 1. Installation
```bash
cd meditrack_ai
pip install -r requirements.txt
```

### 2. Running Service
```bash
uvicorn app.main:app --port 8001 --reload
```

Service running on: `http://localhost:8001`
Interactive Swagger Docs: `http://localhost:8001/docs`

### 3. Health Check
```bash
curl http://localhost:8001/health
```

## Running Automated Tests
```bash
python -m pytest tests/
```
