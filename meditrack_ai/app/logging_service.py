import logging
import sys
import time

def setup_safe_logging():
    logger = logging.getLogger("meditrack_ai")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [MediTrack-AI] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

safe_logger = setup_safe_logging()

def log_triage_event(session_id: str, triage_level: str, is_emergency: bool, duration_ms: float, provider_mode: str):
    """
    Safely logs triage operational metadata without logging raw patient symptom PII.
    """
    safe_logger.info(
        f"Session: {session_id} | TriageLevel: {triage_level} | Emergency: {is_emergency} | "
        f"Latency: {duration_ms:.2f}ms | Provider: {provider_mode}"
    )
