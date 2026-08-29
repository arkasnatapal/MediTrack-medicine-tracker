from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PatientVitals(BaseModel):
    spo2: Optional[int] = None # Oxygen Saturation % (Normal: 95-100%)
    temperature_f: Optional[float] = None # Body Temp in Fahrenheit (Normal: 97-99°F)
    pulse_bpm: Optional[int] = None # Heart Rate BPM (Normal: 60-100)
    bp_systolic: Optional[int] = None # Systolic Blood Pressure (Normal: 90-120)
    bp_diastolic: Optional[int] = None # Diastolic Blood Pressure (Normal: 60-80)

class SymptomExtractionRequest(BaseModel):
    user_input: str
    age: Optional[int] = 30
    gender: Optional[str] = "unspecified"
    existing_symptoms: Optional[List[str]] = []
    vitals: Optional[PatientVitals] = None

class StructuredSymptoms(BaseModel):
    symptoms: List[str] = []
    severity: str = "UNKNOWN" # MILD, MODERATE, SEVERE, UNKNOWN
    duration: str = "UNKNOWN"
    onset: str = "UNKNOWN" # SUDDEN, GRADUAL, UNKNOWN
    associated_symptoms: List[str] = []
    age_group: str = "ADULT"
    relevant_context: List[str] = []
    red_flags_detected: List[str] = []
    missing_information: List[str] = []
    vitals: Optional[PatientVitals] = None

class FollowUpQuestion(BaseModel):
    id: str
    question: str
    options: Optional[List[str]] = None
    category: str = "general"

class SafetyEngineResult(BaseModel):
    is_emergency: bool
    triggered_rules: List[Dict[str, Any]] = []
    urgency: str # EMERGENCY, URGENT, ROUTINE, SELF_CARE
    recommended_action: str
    requires_immediate_attention: bool
    escalation_reason: Optional[str] = None
    vitals_warning: Optional[str] = None

class MedicalEvidence(BaseModel):
    title: str
    organization: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    license: Optional[str] = "Public Health Guidance"
    summary: str

class TriageSessionCreate(BaseModel):
    patient_id: Optional[str] = "anonymous"
    initial_symptoms: Optional[List[str]] = []
    free_text: Optional[str] = ""
    age: Optional[int] = 30
    gender: Optional[str] = "unspecified"

class TriageMessageRequest(BaseModel):
    session_id: str
    message: str
    symptoms_selected: Optional[List[str]] = []
    follow_up_answers: Optional[Dict[str, Any]] = {}
    vitals: Optional[PatientVitals] = None

class CareNavigationOption(BaseModel):
    facility_type: str
    title: str
    description: str
    action_type: str # EMERGENCY_CALL, FIND_FACILITY, BOOK_APPOINTMENT
    action_url: Optional[str] = None
    phone_number: Optional[str] = None

class TriageResultResponse(BaseModel):
    session_id: str
    triage_level: str # EMERGENCY, URGENT, ROUTINE, SELF_CARE
    urgency_level: str # CRITICAL_HIGH, HIGH, MODERATE, LOW
    risk_score: int = 15 # 0 to 100 Clinical Risk Score Index
    headline: str
    recommendation: str
    escalate_to_emergency: bool
    confidence: str = "HIGH"
    red_flags: List[str] = []
    structured_symptoms: StructuredSymptoms
    ai_assistance_used: bool = True
    provider_mode: str = "LOCAL_SAFETY_AI"
    follow_up_questions: List[FollowUpQuestion] = []
    retrieved_knowledge: List[MedicalEvidence] = []
    first_aid_steps: List[Dict[str, Any]] = []
    contraindications: List[str] = []
    possible_clinical_concerns: List[str] = []
    care_navigation: List[CareNavigationOption] = []
    recommended_facility_type: str = "PHC"
    disclaimer: str = (
        "Notice: MediTrack AI Triage is an automated care-navigation assistant and NOT a replacement for "
        "professional medical diagnosis or treatment. In case of emergency, contact 108 / 112 immediately."
    )

class TriageFeedbackRequest(BaseModel):
    session_id: str
    rating: int # 1 to 5
    helpful: bool
    comments: Optional[str] = None
