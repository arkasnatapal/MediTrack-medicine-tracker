import re
from typing import List, Optional
from .schemas import StructuredSymptoms

# Expanded Clinical Symptom Ontology by Body Systems
CLINICAL_SYMPTOM_MAP = {
    # Cardiac / Vascular
    "chest pain": ["chest pain", "chest tightness", "chest pressure", "crushing chest", "heart pain", "cardiac pain"],
    "palpitations": ["palpitations", "racing heart", "heart pounding", "irregular heartbeat", "skipped beats"],
    "leg swelling": ["leg swelling", "swollen feet", "swollen ankles", "edema"],

    # Respiratory
    "shortness of breath": ["shortness of breath", "breathing difficulty", "hard to breathe", "breathless", "dyspnea", "gasping", "wheezing"],
    "cough": ["cough", "coughing", "dry cough", "wet cough", "phlegm", "coughing blood", "hemoptysis"],
    "sore throat": ["sore throat", "throat pain", "throat irritation", "difficulty swallowing", "painful swallowing"],
    "sinus pressure": ["sinus pain", "sinus pressure", "nasal congestion", "blocked nose", "runny nose"],

    # Neurological / Cranial
    "headache": ["headache", "head pain", "migraine", "throbbing head", "head pressure"],
    "dizziness/vertigo": ["dizziness", "dizzy", "lightheaded", "giddiness", "spinning", "vertigo", "loss of balance"],
    "numbness/tingling": ["numbness", "tingling", "pins and needles", "loss of sensation", "paralysis", "weakness in arm", "weakness in leg"],
    "confusion/memory": ["confusion", "disoriented", "memory loss", "brain fog", "slurred speech"],

    # Ophthalmic & ENT
    "eye pain/vision": ["eye pain", "double vision", "blurred vision", "loss of vision", "red eye", "eye redness", "pain behind eye", "flashing lights"],
    "ear pain/discharge": ["ear ache", "ear pain", "ear discharge", "fluid from ear", "tinnitus", "ringing in ear", "hearing loss"],

    # Gastrointestinal / Abdominal
    "abdominal pain": ["stomach pain", "abdominal pain", "belly ache", "stomach cramp", "sharp stomach pain", "flank pain", "pain in my abs", "abs pain", "belly pain", "gut pain", "tummy ache"],

    "nausea/vomiting": ["nausea", "vomiting", "throwing up", "puking", "sick to stomach", "vomiting blood"],
    "acid reflux/heartburn": ["heartburn", "acid reflux", "indigestion", "burning in chest", "acid belching"],
    "bowel changes": ["diarrhea", "loose motions", "constipation", "bloody stool", "black stool", "dark stool"],

    # Musculoskeletal & Spine
    "back pain": ["back pain", "lower back pain", "spine pain", "lumbar pain", "stiff back"],
    "joint pain/swelling": ["joint pain", "knee pain", "swollen joint", "joint stiffness", "shoulder pain", "hip pain", "ankle pain", "wrist pain"],
    "muscle pain/cramps": ["muscle pain", "body ache", "myalgia", "muscle cramps", "stiff neck"],

    # Dermatological / Soft Tissue
    "skin rash/hives": ["rash", "skin redness", "hives", "itching", "skin allergy", "skin bumps", "blisters"],
    "wound/abscess": ["wound", "cut", "laceration", "boil", "abscess", "pus", "swelling", "infection"],

    # Genitourinary & Renal
    "urinary symptoms": ["painful urination", "burning urination", "frequent urination", "blood in urine", "difficulty urinating"],

    # Systemic / General
    "fever": ["fever", "high temperature", "chills", "feverish", "body heat", "sweating"],
    "fatigue/weakness": ["extreme fatigue", "weakness", "exhaustion", "lethargy", "low energy"],
    "weight loss": ["unexplained weight loss", "loss of appetite"]
}

class SymptomExtractor:
    def extract_phrases_from_text(self, text: str) -> List[str]:
        """
        Extracts key noun & adjective symptom phrases directly from free text
        when predefined patterns do not match.
        """
        # Stopwords to clean
        stopwords = {"i", "have", "been", "feeling", "having", "a", "an", "the", "and", "or", "but", "is", "was", "my", "me", "with", "since", "today", "yesterday", "very", "so", "much", "too", "some", "any"}
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        meaningful = [w for w in words if w not in stopwords]
        
        # Form 2-3 word symptom chunks if meaningful
        phrases = []
        if len(meaningful) >= 2:
            for i in range(len(meaningful) - 1):
                phrase = f"{meaningful[i]} {meaningful[i+1]}"
                if any(k in phrase for k in ["pain", "ache", "swelling", "fever", "bleed", "burn", "numb", "stiff", "sore", "red", "vision", "discharge", "cramp", "itch"]):
                    phrases.append(phrase)
        if not phrases and meaningful:
            phrases.append(" ".join(meaningful[:3]))
            
        return phrases

    def extract_from_text(self, text: str, age: int = 30, gender: str = "unspecified", existing_symptoms: Optional[List[str]] = None) -> StructuredSymptoms:
        """
        Robust clinical natural language symptom extractor.
        Converts ANY user free-text input into structured clinical parameters.
        """
        existing_symptoms = existing_symptoms or []
        text_lower = text.lower()
        extracted_symptoms = list(existing_symptoms)
        associated_symptoms = []
        red_flags_detected = []
        missing_information = []

        # 1. Match against comprehensive ontology map
        for key, synonyms in CLINICAL_SYMPTOM_MAP.items():
            if any(syn in text_lower for syn in synonyms):
                if key not in extracted_symptoms:
                    extracted_symptoms.append(key)

        # 2. Dynamic Fallback Phrase Extraction if no ontology matched
        if not extracted_symptoms and text.strip():
            dynamic_phrases = self.extract_phrases_from_text(text)
            for dp in dynamic_phrases:
                if dp not in extracted_symptoms:
                    extracted_symptoms.append(dp)

        # Ensure extracted_symptoms is NEVER empty if free-text is provided
        if not extracted_symptoms and text.strip():
            extracted_symptoms.append(text.strip()[:40])

        # Detect severity indicators
        severity = "MODERATE"
        if any(w in text_lower for w in ["severe", "extreme", "unbearable", "worst", "intense", "crushing", "cannot stand", "sharp"]):
            severity = "SEVERE"
        elif any(w in text_lower for w in ["mild", "slight", "minor", "little bit", "just started"]):
            severity = "MILD"

        # Detect duration indicators
        duration = "UNKNOWN"
        duration_match = re.search(r"(\d+)\s*(days?|hours?|weeks?|months?|minutes?)", text_lower)
        if duration_match:
            duration = f"{duration_match.group(1)} {duration_match.group(2)}"
        elif "today" in text_lower or "this morning" in text_lower:
            duration = "1 day"
        elif "yesterday" in text_lower:
            duration = "2 days"

        # Detect onset
        onset = "GRADUAL"
        if any(w in text_lower for w in ["sudden", "suddenly", "abrupt", "all of a sudden", "out of nowhere"]):
            onset = "SUDDEN"

        # Age group classification
        age_group = "ADULT"
        if age < 12:
            age_group = "PEDIATRIC"
        elif age > 65:
            age_group = "GERIATRIC"

        if duration == "UNKNOWN":
            missing_information.append("duration")
        if severity == "UNKNOWN":
            missing_information.append("severity")

        return StructuredSymptoms(
            symptoms=extracted_symptoms,
            severity=severity,
            duration=duration,
            onset=onset,
            associated_symptoms=associated_symptoms,
            age_group=age_group,
            relevant_context=[f"Age: {age}", f"Gender: {gender}"],
            red_flags_detected=red_flags_detected,
            missing_information=missing_information
        )

symptom_extractor = SymptomExtractor()
