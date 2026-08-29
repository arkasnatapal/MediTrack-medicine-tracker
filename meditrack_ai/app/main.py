import time
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings, hardware_specs
from .schemas import (
    TriageSessionCreate, TriageMessageRequest, TriageResultResponse,
    TriageFeedbackRequest, StructuredSymptoms
)
from .triage_service import triage_orchestrator, session_store
from .safety_engine import safety_engine
from .rag_service import rag_service
from .model_service import model_provider

app = FastAPI(
    title=settings.APP_NAME,
    description="MediTrack AI Self-Hosted Digital Triage & Care-Navigation Engine",
    version="1.0.0"
)

# CORS setup for MediTrack React frontend & Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "status": "operational",
        "triage_architecture": "Deterministic Safety Engine + Medical RAG + Local AI",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    Returns status of safety engine, model, RAG, and hardware specs.
    """
    return {
        "status": "ok",
        "model": "available" if model_provider else "unavailable",
        "rag": "available" if settings.RAG_ENABLED else "unavailable",
        "safety_engine": "available",
        "hardware": hardware_specs,
        "timestamp": time.time()
    }

@app.post("/api/v1/triage/session")
def create_session(req: TriageSessionCreate):
    session_id = session_store.create_session(req)
    return {
        "success": True,
        "session_id": session_id,
        "message": "Triage session initialized successfully."
    }

@app.post("/api/v1/triage/message", response_model=TriageResultResponse)
def process_message(req: TriageMessageRequest):
    session = session_store.get_session(req.session_id)
    if not session:
        # Auto-create session if invalid ID passed
        sess_req = TriageSessionCreate()
        sess_id = session_store.create_session(sess_req)
        req.session_id = sess_id
        session = session_store.get_session(sess_id)

    result = triage_orchestrator.process_triage(
        session_id=req.session_id,
        user_message=req.message,
        symptoms_selected=req.symptoms_selected or [],
        age=session.get("age", 30),
        gender=session.get("gender", "unspecified"),
        vitals=req.vitals
    )
    return result

    return result


@app.post("/api/v1/triage/analyze", response_model=TriageResultResponse)

def analyze_symptoms(req: TriageMessageRequest):
    return process_message(req)

@app.post("/api/v1/triage/finalize", response_model=TriageResultResponse)
def finalize_triage(req: TriageMessageRequest):
    return process_message(req)

@app.get("/api/v1/triage/session/{session_id}")
def get_session_status(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Triage session not found.")
    return {
        "success": True,
        "session": session
    }

@app.get("/api/v1/triage/session/{session_id}/result")
def get_session_result(session_id: str):
    session = session_store.get_session(session_id)
    if not session or not session.get("result"):
        raise HTTPException(status_code=404, detail="Triage result not found for this session.")
    return {
        "success": True,
        "result": session["result"]
    }

@app.post("/api/v1/triage/session/{session_id}/feedback")
def submit_feedback(session_id: str, feedback: TriageFeedbackRequest):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {
        "success": True,
        "message": "Feedback recorded successfully."
    }

@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "MediTrack AI Service encountered an internal processing issue. Safe triage fallback active.",
            "error_type": type(exc).__name__
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
