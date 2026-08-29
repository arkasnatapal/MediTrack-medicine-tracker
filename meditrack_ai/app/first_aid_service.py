from typing import List, Dict, Any
from .schemas import StructuredSymptoms

class FirstAidService:
    def get_first_aid_protocol(self, symptoms: List[str], triage_level: str, raw_text: str = "") -> Dict[str, Any]:
        text_lower = (raw_text + " " + " ".join(symptoms)).lower()
        
        steps = []
        contraindications = []
        possible_concerns = []

        # 1. CARDIAC / CHEST PAIN FIRST AID PROTOCOL
        if any(k in text_lower for k in ["chest pain", "chest tightness", "heart attack", "cardiac"]):
            steps = [
                {"step": 1, "title": "Rest Patient Immediately", "instruction": "Stop all physical exertion. Have the patient sit down in a semi-upright position (back supported, knees bent)."},
                {"step": 2, "title": "Loosen Constricting Clothing", "instruction": "Unbutton collar, loosen belt or tight clothing around neck and chest to ease breathing."},
                {"step": 3, "title": "Administer Aspirin if Approved", "instruction": "If patient is conscious and has no allergy or active bleeding, 300mg chewable Aspirin may be taken if previously advised by a physician."},
                {"step": 4, "title": "Call 108 Emergency", "instruction": "Do not attempt to drive self to hospital. Wait for emergency medical transport with ECG equipment."}
            ]
            contraindications = [
                "DO NOT leave the patient unattended.",
                "DO NOT give food, water, or alcoholic beverages.",
                "DO NOT allow the patient to walk or exercise."
            ]
            possible_concerns = ["Acute Coronary Syndrome", "Myocardial Ischemia", "Angina Pectoris", "Pericarditis"]

        # 2. SEVERE BREATHLESSNESS / ASTHMA / RESPIRATORY
        elif any(k in text_lower for k in ["breathing", "shortness of breath", "gasping", "breathless", "asthma"]):
            steps = [
                {"step": 1, "title": "Sit Upright", "instruction": "Sit the patient fully upright leaning slightly forward. Do NOT lie flat on back."},
                {"step": 2, "title": "Use Rescue Inhaler", "instruction": "If patient has a prescribed bronchodilator (Salbutamol inhaler), administer 2-4 puffs via spacer immediately."},
                {"step": 3, "title": "Calm & Pursed-Lip Breathing", "instruction": "Guide patient to inhale slowly through nose and exhale slowly through pursed lips to reduce panic."},
                {"step": 4, "title": "Ensure Ventilation", "instruction": "Open windows or ensure fresh airflow. Clear crowd from around patient."}
            ]
            contraindications = [
                "DO NOT lay patient flat on back.",
                "DO NOT force liquids into mouth during severe gasping."
            ]
            possible_concerns = ["Acute Bronchospasm", "COPD Exacerbation", "Pulmonary Edema", "Pneumothorax"]

        # 3. UNCONSCIOUSNESS / SYNCOPE
        elif any(k in text_lower for k in ["unconscious", "fainted", "syncope", "passed out"]):
            steps = [
                {"step": 1, "title": "Place in Recovery Position", "instruction": "Turn patient onto their side (Left Lateral Recovery Position) with top knee bent to keep airway open and prevent choking."},
                {"step": 2, "title": "Check Airway & Breathing", "instruction": "Tilt head back slightly, lift chin, and check for chest rise and breath sounds."},
                {"step": 3, "title": "Elevate Legs if Fainted", "instruction": "If simple fainting, elevate feet 12 inches above heart level to boost cerebral blood flow."}
            ]
            contraindications = [
                "DO NOT slap, shake, or pour water on an unconscious person's face.",
                "DO NOT put food, water, or medicine in the mouth.",
                "DO NOT place pillow under head if breathing is noisy."
            ]
            possible_concerns = ["Vasovagal Syncope", "Hypoglycemia", "Transient Ischemic Attack", "Arrhythmia"]

        # 4. HIGH FEVER PROTOCOL
        elif any(k in text_lower for k in ["fever", "high temperature", "chills"]):
            steps = [
                {"step": 1, "title": "Tepid Sponging", "instruction": "Apply damp cloth with room-temperature water on forehead, neck, and armpits. Avoid ice cold water."},
                {"step": 2, "title": "Hydration Support", "instruction": "Sip ORS (Oral Rehydration Solution), coconut water, or clean boiled water to prevent dehydration."},
                {"step": 3, "title": "Antipyretic Care", "instruction": "Paracetamol (500mg-650mg) may be taken as directed if no liver disease or contraindication exists."}
            ]
            contraindications = [
                "DO NOT use cold ice baths or alcohol rubs.",
                "DO NOT bundle in heavy blankets during high fever peak."
            ]
            possible_concerns = ["Acute Febrile Illness", "Viral Infection", "Malaria / Dengue", "Urinary Tract Infection"]

        # 5. GENERAL / MILD SYMPTOM FIRST AID
        else:
            steps = [
                {"step": 1, "title": "Rest & Monitor Vitals", "instruction": "Rest comfortably and measure body temperature, pulse, and oxygen level if SpO2 meter is available."},
                {"step": 2, "title": "Hydrate & Avoid Strain", "instruction": "Drink adequate fluids and avoid strenuous physical or mental stress."},
                {"step": 3, "title": "Prepare Medical History", "instruction": "List your onset time, medication allergies, and active prescriptions for your OPD consultation."}
            ]
            contraindications = [
                "DO NOT self-prescribe unverified antibiotics or strong painkillers."
            ]
            possible_concerns = ["Primary Outpatient Evaluation Needed"]

        return {
            "first_aid_steps": steps,
            "contraindications": contraindications,
            "possible_clinical_concerns": possible_concerns
        }

first_aid_service = FirstAidService()
