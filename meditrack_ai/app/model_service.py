import logging
import os
import requests
import json
from dotenv import load_dotenv
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from .config import settings, hardware_specs
from .schemas import StructuredSymptoms, MedicalEvidence

# Ensure environment variables from .env are loaded
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

logger = logging.getLogger("meditrack_ai.model_service")

# Default Clinical Category Follow-up Questions (Fallback if offline)
CATEGORY_QUESTIONS = {
    "chest pain": [
        {"id": "q_chest_quality", "question": "What kind of pain or discomfort are you feeling in your chest?", "options": ["Heavy crushing pressure", "Sharp stabbing pain", "Burning / acid-like", "Dull persistent ache"], "category": "cardiac"},
        {"id": "q_chest_radiation", "question": "Does the pain spread or radiate to any other body part?", "options": ["Spreads to left arm / shoulder", "Spreads to jaw or neck", "Spreads to upper back", "Does not radiate anywhere"], "category": "cardiac"},
        {"id": "q_chest_timing", "question": "When did this chest discomfort first begin?", "options": ["Started suddenly today", "1-2 days ago", "Intermittent over a week", "Constant for several days"], "category": "timing"},
        {"id": "q_chest_associated", "question": "Are you experiencing cold sweating, dizziness, or breathlessness?", "options": ["Cold sweating & nausea", "Dizziness or faintness", "Breathlessness when resting", "None of these"], "category": "associated"}
    ],
    "shortness of breath": [
        {"id": "q_breath_rest", "question": "How severe is your breathlessness right now?", "options": ["Breathless while resting still", "Breathless when walking slowly", "Only when climbing stairs", "Mild tightness only"], "category": "respiratory"},
        {"id": "q_breath_sound", "question": "Do you hear any high-pitched wheezing or rattling sound when breathing?", "options": ["Wheezing sound when breathing out", "Rattling cough with phlegm", "No chest sounds"], "category": "respiratory"},
        {"id": "q_breath_timing", "question": "When did this difficulty breathing start?", "options": ["Sudden onset today", "Gradually over 2-3 days", "Chronic condition worsening"], "category": "timing"}
    ],
    "fever": [
        {"id": "q_fever_temp", "question": "How high has your body temperature reached?", "options": ["Mild fever (<100°F)", "Moderate fever (100°F - 102°F)", "High fever (>102.5°F)", "Not measured with thermometer"], "category": "febrile"},
        {"id": "q_fever_chills", "question": "Are you experiencing severe shivering, chills, or night sweats?", "options": ["Severe chills & shivering", "Mild body heat only", "Sweating in episodes"], "category": "febrile"},
        {"id": "q_fever_timing", "question": "How many days has this fever been present?", "options": ["Started today", "1 to 2 days", "3 to 5 days", "More than a week"], "category": "timing"}
    ],
    "headache": [
        {"id": "q_headache_quality", "question": "How would you describe the location and nature of the headache?", "options": ["Throbbing on one side", "Crushing band around forehead", "Sharp pain behind one eye", "Dull heavy pressure all over"], "category": "cranial"},
        {"id": "q_headache_stiffness", "question": "Do you have any neck stiffness, light sensitivity, or vomiting?", "options": ["Stiff neck & light sensitivity", "Nausea or vomiting", "Blurred vision", "None of these"], "category": "cranial"},
        {"id": "q_headache_timing", "question": "How quickly did this headache reach its peak intensity?", "options": ["Thunderclap / Instant peak", "Gradually over hours", "Intermittent over days"], "category": "timing"}
    ],
    "abdominal pain": [
        {"id": "q_abdo_location", "question": "Which specific area of your abdomen / abs hurts the most?", "options": ["Right lower quadrant (near hip)", "Upper middle (stomach pit)", "Left lower side", "Generalized belly cramps"], "category": "gastrointestinal"},
        {"id": "q_abdo_character", "question": "What is the character of the abdominal pain?", "options": ["Constant sharp stabbing pain", "Cramping in waves", "Dull burning discomfort"], "category": "gastrointestinal"},
        {"id": "q_abdo_vomit", "question": "Have you experienced persistent vomiting or inability to keep liquids down?", "options": ["Persistent vomiting", "Nausea without vomiting", "Normal digestion"], "category": "gastrointestinal"}
    ],
    "joint pain": [
        {"id": "q_joint_location", "question": "Which joint is primarily affected?", "options": ["Knee joint", "Ankle or foot", "Shoulder or arm", "Multiple joints"], "category": "musculoskeletal"},
        {"id": "q_joint_heat", "question": "Is the joint swollen, red, or warm to the touch?", "options": ["Significantly swollen & warm", "Mildly swollen", "No visible swelling"], "category": "musculoskeletal"},
        {"id": "q_joint_weight", "question": "Can you put weight on the affected limb or move the joint freely?", "options": ["Cannot bear any weight", "Painful when walking", "Full movement possible"], "category": "musculoskeletal"}
    ]
}

class MedicalModelProvider(ABC):
    @abstractmethod
    def generate_explanation(
        self,
        structured_symptoms: StructuredSymptoms,
        triage_level: str,
        retrieved_evidence: List[MedicalEvidence]
    ) -> str:
        pass

    @abstractmethod
    def generate_follow_up_questions(
        self,
        structured_symptoms: StructuredSymptoms
    ) -> List[Dict[str, Any]]:
        pass


class GeminiModelProvider(MedicalModelProvider):
    """
    Google Gemini 3.1 Flash Lite Clinical Generative AI Model Provider.
    Dynamically generates questions and detailed multi-paragraph clinical reports.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = "gemini-3.1-flash-lite"
        if self.api_key:
            logger.info(f"Initialized Google {self.model_name} Medical Model Provider.")
        else:
            logger.warning("GEMINI_API_KEY missing. Operating in safe clinical NLU mode.")

    def _call_gemini_api(self, prompt: str, max_tokens: int = 500) -> Optional[str]:
        if not self.api_key:
            return None
        
        # Try primary model gemini-3.1-flash-lite, fallback to gemini-2.5-flash
        models_to_try = ["gemini-3.1-flash-lite", "gemini-2.5-flash"]
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": max_tokens
                    }
                }
                res = requests.post(url, json=payload, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text:
                        return text
            except Exception as e:
                logger.warning(f"Gemini API ({model}) call note: {e}")
        return None

    def generate_explanation(
        self,
        structured_symptoms: StructuredSymptoms,
        triage_level: str,
        retrieved_evidence: List[MedicalEvidence]
    ) -> str:
        symptoms_str = ", ".join(structured_symptoms.symptoms) or "reported symptoms"
        evidence_summary = retrieved_evidence[0].summary if retrieved_evidence else ""

        # 1. Call Gemini Clinical Generative Model for Detailed Clinical Assessment Report
        prompt = (
            f"You are MediTrack AI Senior Clinical Assessment Specialist. "
            f"Analyze this patient profile:\n"
            f"• Symptoms: {symptoms_str}\n"
            f"• Triage Urgency Level: {triage_level}\n"
            f"• Severity: {structured_symptoms.severity}, Onset: {structured_symptoms.onset}\n"
            f"• Clinical Evidence Guidance: '{evidence_summary}'\n\n"
            f"Format the output using clean Markdown section headings (### Title):\n"
            f"### Clinical Symptom Breakdown & Underlying Mechanisms\n"
            f"### Physiological Risk Assessment & Warning Signs\n"
            f"### Healthcare Navigation & Recommended Care Pathway (specify whether District Hospital, CHC, PHC, or Teleconsultation is recommended)\n\n"
            f"Keep tone professional, empathetic, and clear. DO NOT write 'Paragraph 1', 'Paragraph 2', or section numbers (1, 2, 3). Do not mention AI model names or provide a definitive diagnosis."
        )
        gemini_text = self._call_gemini_api(prompt, max_tokens=450)
        if gemini_text:
            return gemini_text

        # 2. Safe Fallback Clinical Generator
        if triage_level == "EMERGENCY":
            return (
                f"Your reported symptoms ({symptoms_str}) present critical emergency warning signs requiring "
                f"immediate medical evaluation. Clinical protocol indicates: '{evidence_summary}'. "
                f"Please do not delay seeking immediate emergency medical transport (108 / 112)."
            )
        elif triage_level == "URGENT":
            return (
                f"Your reported complaint ({symptoms_str}) demonstrates {structured_symptoms.severity.lower()} severity. "
                f"Clinical evidence recommends prompt evaluation at a Community Health Centre (CHC) or urgent care clinic within 24 hours."
            )
        else:
            return (
                f"Your reported complaint ({symptoms_str}) has been evaluated with a clinical severity rating of {structured_symptoms.severity.lower()}. "
                f"These symptoms are suitable for routine consultation at a Primary Health Centre (PHC), outpatient OPD, or via digital teleconsultation."
            )

    def generate_follow_up_questions(
        self,
        structured_symptoms: StructuredSymptoms
    ) -> List[Dict[str, Any]]:
        symptoms_str = ", ".join(structured_symptoms.symptoms) or "reported symptoms"

        # 1. Try Generating Tailored Questions dynamically using Gemini 3.1 Flash Lite
        prompt = (
            f"Generate 3 interactive clinical follow-up questions for a patient reporting: '{symptoms_str}'.\n"
            f"Return ONLY a JSON array of objects with keys 'id', 'question', 'options' (array of 3-4 strings), and 'category'.\n"
            f"Example format:\n"
            f'[{{"id": "q1", "question": "Where is the pain most severe?", "options": ["Option A", "Option B", "Option C"], "category": "location"}}]'
        )
        raw_json = self._call_gemini_api(prompt, max_tokens=350)
        if raw_json:
            try:
                # Clean code blocks if present
                clean_json = raw_json.replace("```json", "").replace("```", "").strip()
                parsed_qs = json.loads(clean_json)
                if isinstance(parsed_qs, list) and len(parsed_qs) >= 2:
                    return parsed_qs[:4]
            except Exception as e:
                logger.warning(f"Gemini dynamic questions parse note: {e}")

        # 2. Fallback to predefined Category Questions if API is offline
        questions = []
        for sym in structured_symptoms.symptoms:
            sym_lower = sym.lower()
            for cat_key, cat_qs in CATEGORY_QUESTIONS.items():
                if any(k in sym_lower for k in cat_key.split("/")):
                    for q in cat_qs:
                        if q not in questions:
                            questions.append(q)

        if len(questions) < 3:
            questions.append({
                "id": "q_timing_gen",
                "question": f"When did your {symptoms_str} first begin?",
                "options": ["Just started today", "1-2 days ago", "3-7 days ago", "More than a week ago"],
                "category": "timing"
            })
            questions.append({
                "id": "q_severity_gen",
                "question": f"How would you rate the pain or discomfort level of your {symptoms_str}?",
                "options": ["Mild / Discomforting", "Moderate / Uncomfortable", "Severe / Distressing"],
                "category": "severity"
            })
            questions.append({
                "id": "q_associated_gen",
                "question": f"Have you noticed any fever, dizziness, or nausea associated with your {symptoms_str}?",
                "options": ["No associated symptoms", "Mild fever or fatigue", "Nausea or high fever"],
                "category": "associated"
            })

        return questions[:4]


def get_model_provider() -> MedicalModelProvider:
    return GeminiModelProvider()

model_provider = get_model_provider()
