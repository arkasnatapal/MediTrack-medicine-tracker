import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional
from .schemas import (
    StructuredSymptoms, SafetyEngineResult, TriageResultResponse,
    FollowUpQuestion, TriageMessageRequest, TriageSessionCreate, PatientVitals
)
from .symptom_extractor import symptom_extractor
from .safety_engine import safety_engine
from .rag_service import rag_service
from .model_service import model_provider
from .care_navigator import care_navigator
from .first_aid_service import first_aid_service
from .logging_service import log_triage_event

PROMPT_INJECTION_KEYWORDS = [
    "ignore all previous instructions",
    "ignore safety rules",
    "pretend you are fine",
    "tell me i am fine",
    "give me a diagnosis",
    "override safety",
    "you are now a doctor",
    "system prompt"
]

class TriageSessionStore:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, req: TriageSessionCreate) -> str:
        session_id = f"TRG-{uuid.uuid4().hex[:12].upper()}"
        self.sessions[session_id] = {
            "session_id": session_id,
            "patient_id": req.patient_id,
            "age": req.age,
            "gender": req.gender,
            "initial_symptoms": req.initial_symptoms or [],
            "history": [],
            "structured_symptoms": None,
            "result": None,
            "created_at": time.time()
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)

    def save_result(self, session_id: str, result: TriageResultResponse):
        if session_id in self.sessions:
            self.sessions[session_id]["result"] = result

session_store = TriageSessionStore()


class TriageOrchestrator:
    def sanitize_input(self, text: str) -> str:
        """Sanitizes user text against prompt injection attempts."""
        text_lower = text.lower()
        for pattern in PROMPT_INJECTION_KEYWORDS:
            if pattern in text_lower:
                text = text.replace(pattern, "[sanitized]")
        return text

    def calculate_risk_score(self, safety_result: SafetyEngineResult, structured: StructuredSymptoms) -> int:
        """Calculates a clinical risk score from 0 to 100."""
        score = 15
        if safety_result.urgency == "EMERGENCY":
            score = 90 + len(safety_result.triggered_rules) * 3
            if score > 99: score = 99
        elif safety_result.urgency == "URGENT":
            score = 65
        elif structured.severity == "MODERATE":
            score = 40

        if structured.vitals:
            v = structured.vitals
            if v.spo2 and v.spo2 < 92: score += 10
            if v.temperature_f and v.temperature_f > 102: score += 5
            
        return min(max(score, 5), 99)

    def process_triage(
        self,
        session_id: str,
        user_message: str,
        symptoms_selected: List[str],
        age: int = 30,
        gender: str = "unspecified",
        vitals: Optional[PatientVitals] = None
    ) -> TriageResultResponse:
        start_time = time.time()

        clean_text = self.sanitize_input(user_message)

        structured = symptom_extractor.extract_from_text(
            text=clean_text,
            age=age,
            gender=gender,
            existing_symptoms=symptoms_selected
        )
        structured.vitals = vitals

        safety_result: SafetyEngineResult = safety_engine.evaluate(structured, raw_text=clean_text)

        retrieved_evidence = rag_service.retrieve(structured, query=clean_text)

        # First Aid Protocol & Clinical Considerations
        fa_data = first_aid_service.get_first_aid_protocol(
            symptoms=structured.symptoms,
            triage_level=safety_result.urgency,
            raw_text=clean_text
        
        )

        follow_up_qs = []
        with ThreadPoolExecutor(max_workers=2) as executor:
            fut_qs = executor.submit(model_provider.generate_follow_up_questions, structured)
            fut_exp = executor.submit(
                model_provider.generate_explanation,
                structured_symptoms=structured,
                triage_level=safety_result.urgency,
                retrieved_evidence=retrieved_evidence
            )
            raw_qs = fut_qs.result()
            explanation = fut_exp.result()

        for q in raw_qs:
            follow_up_qs.append(FollowUpQuestion(
                id=q["id"],
                question=q["question"],
                options=q.get("options"),
                category=q.get("category", "general")
            ))

        care_options = care_navigator.get_navigation_options(safety_result)

        risk_score = self.calculate_risk_score(safety_result, structured)

        if safety_result.urgency == "EMERGENCY":
            urgency_level = "CRITICAL_HIGH"
            headline = "⚠️ POSSIBLE MEDICAL EMERGENCY — IMMEDIATE CARE REQUIRED"
            recommended_facility_type = "DISTRICT_HOSPITAL"
        elif safety_result.urgency == "URGENT":
            urgency_level = "HIGH"
            headline = "PROMPT CLINICAL EVALUATION RECOMMENDED"
            recommended_facility_type = "CHC"
        else:
            urgency_level = "LOW"
            headline = "ROUTINE PRIMARY HEALTHCARE CONSULTATION"
            recommended_facility_type = "PHC"

        red_flags_list = [r["description"] for r in safety_result.triggered_rules]
        if safety_result.vitals_warning:
            red_flags_list.insert(0, safety_result.vitals_warning)

        result = TriageResultResponse(
            session_id=session_id,
            triage_level=safety_result.urgency,
            urgency_level=urgency_level,
            risk_score=risk_score,
            headline=headline,
            recommendation=explanation or safety_result.recommended_action,
            escalate_to_emergency=safety_result.is_emergency,
            confidence="HIGH",
            red_flags=red_flags_list,
            structured_symptoms=structured,
            ai_assistance_used=True,
            provider_mode="MEDITRACK_CLINICAL_AI" if getattr(model_provider, "api_key", None) else "SAFETY_ENGINE_LOCAL_AI",

            follow_up_questions=follow_up_qs,

            retrieved_knowledge=retrieved_evidence,
            first_aid_steps=fa_data["first_aid_steps"],
            contraindications=fa_data["contraindications"],
            possible_clinical_concerns=fa_data["possible_clinical_concerns"],
            care_navigation=care_options,
            recommended_facility_type=recommended_facility_type
        )

        session_store.save_result(session_id, result)

        latency_ms = (time.time() - start_time) * 1000
        log_triage_event(session_id, result.triage_level, result.escalate_to_emergency, latency_ms, result.provider_mode)

        return result

triage_orchestrator = TriageOrchestrator()
