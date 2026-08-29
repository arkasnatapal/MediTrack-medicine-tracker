from typing import List, Dict, Any
from .schemas import StructuredSymptoms, SafetyEngineResult

class RedFlagRule:
    def __init__(self, rule_id: str, category: str, keywords: List[str], severity: str, action: str, description: str):
        self.id = rule_id
        self.category = category
        self.keywords = [k.lower() for k in keywords]
        self.severity = severity
        self.action = action
        self.description = description

RED_FLAG_RULES: List[RedFlagRule] = [
    RedFlagRule(
        rule_id="RF_CARDIAC_01",
        category="CARDIAC_EMERGENCY",
        keywords=["chest pain", "chest tightness", "chest pressure", "heart attack", "crushing pain", "radiating pain to jaw", "radiating pain to left arm"],
        severity="EMERGENCY",
        action="Seek immediate emergency cardiac evaluation. Call emergency services (108 / 112) or reach the nearest hospital emergency department immediately.",
        description="Chest pain/tightness indicates potential acute coronary syndrome or serious cardiac event."
    ),
    RedFlagRule(
        rule_id="RF_RESPIRATORY_01",
        category="RESPIRATORY_EMERGENCY",
        keywords=["cannot breathe", "difficulty breathing", "shortness of breath", "severe breathlessness", "gasping", "bluish lips", "cyanosis", "unable to speak full sentences"],
        severity="EMERGENCY",
        action="Immediate emergency airway & respiratory intervention needed. Contact 108 / 112 or visit nearest emergency trauma facility.",
        description="Severe dyspnea or respiratory distress is a life-threatening medical emergency."
    ),
    RedFlagRule(
        rule_id="RF_STROKE_01",
        category="NEUROLOGICAL_STROKE",
        keywords=["facial drooping", "face drooping", "arm weakness", "slurred speech", "sudden numbness", "sudden paralysis", "stroke", "loss of speech"],
        severity="EMERGENCY",
        action="Suspected acute stroke (FAST protocol). Immediate stroke emergency transfer to a tertiary hospital with CT scan facility.",
        description="Acute neurological focal deficits suggest acute ischemic or hemorrhagic stroke."
    ),
    RedFlagRule(
        rule_id="RF_CONSCIOUSNESS_01",
        category="ALTERED_CONSCIOUSNESS",
        keywords=["unconscious", "passed out", "syncope", "unresponsive", "fainted", "loss of consciousness", "severe confusion", "disoriented"],
        severity="EMERGENCY",
        action="Call emergency services (108 / 112) immediately. Keep patient safe on their side in recovery position.",
        description="Unconsciousness or acute coma state requires urgent trauma and neurological evaluation."
    ),
    RedFlagRule(
        rule_id="RF_BLEEDING_01",
        category="HEMORRHAGE_TRAUMA",
        keywords=["uncontrolled bleeding", "heavy bleeding", "profuse bleeding", "gushing blood", "arterial bleed", "major wound", "amputation"],
        severity="EMERGENCY",
        action="Apply direct continuous pressure to the wound with a clean cloth. Seek emergency trauma surgical care immediately.",
        description="Severe uncontrolled external or internal hemorrhage causes rapid hypovolemic shock."
    ),
    RedFlagRule(
        rule_id="RF_ANAPHYLAXIS_01",
        category="SEVERE_ALLERGY",
        keywords=["throat swelling", "swollen tongue", "anaphylaxis", "severe allergic reaction", "hives with breathing difficulty", "unable to swallow"],
        severity="EMERGENCY",
        action="Suspected anaphylactic shock. Seek emergency care immediately for epinephrine administration.",
        description="Anaphylactic airway obstruction can progress rapidly to respiratory failure."
    ),
    RedFlagRule(
        rule_id="RF_SEIZURE_01",
        category="CONVULSIONS",
        keywords=["seizure", "convulsions", "epileptic fit", "shaking uncontrollably", "foaming at mouth"],
        severity="EMERGENCY",
        action="Protect head from injury. Do not insert anything into mouth. Seek immediate emergency evaluation.",
        description="Active or recurrent generalized seizures require urgent neuro-emergency care."
    ),
    RedFlagRule(
        rule_id="RF_POISONING_01",
        category="TOXICOLOGY",
        keywords=["poisoning", "swallowed poison", "snakebite", "pesticide intake", "chemical ingestion", "overdose"],
        severity="EMERGENCY",
        action="Contact poison control / anti-snake venom emergency facility immediately. Reach nearest district hospital.",
        description="Acute toxic exposure, envenomation, or overdose requires urgent antidote administration."
    ),
    RedFlagRule(
        rule_id="RF_MENTAL_CRISIS_01",
        category="PSYCHIATRIC_EMERGENCY",
        keywords=["suicidal", "want to kill myself", "self-harm emergency", "want to end my life", "suicide"],
        severity="EMERGENCY",
        action="Please connect with immediate crisis mental health helpline (Tele-MANAS: 14416 / 1800-891-4416 in India) or reach a hospital emergency room.",
        description="Suicidal crisis requires immediate psychiatric safety intervention."
    )
]


class DeterministicSafetyEngine:
    def __init__(self, rules: List[RedFlagRule] = RED_FLAG_RULES):
        self.rules = rules

    def evaluate(self, structured_symptoms: StructuredSymptoms, raw_text: str = "") -> SafetyEngineResult:
        """
        Evaluates extracted structured symptoms, raw text, and patient vitals.
        Returns SafetyEngineResult with priority classification.
        """
        combined_text = (
            raw_text.lower() + " " +
            " ".join(structured_symptoms.symptoms).lower() + " " +
            " ".join(structured_symptoms.associated_symptoms).lower() + " " +
            " ".join(structured_symptoms.red_flags_detected).lower()
        )

        triggered_rules = []
        vitals_warning = None

        # Check Vitals Red Flags
        if structured_symptoms.vitals:
            v = structured_symptoms.vitals
            if v.spo2 and v.spo2 < 92:
                triggered_rules.append({
                    "id": "RF_VITALS_SPO2",
                    "category": "CRITICAL_HYPOXIA",
                    "keyword_matched": f"SpO2: {v.spo2}%",
                    "severity": "EMERGENCY",
                    "action": "Immediate oxygen therapy & emergency respiratory support required.",
                    "description": f"Abnormally low blood oxygen saturation ({v.spo2}% SpO2, threshold < 92%)."
                })
                vitals_warning = f"Critical Hypoxia Alert: SpO2 is {v.spo2}% (Normal: 95-100%)"
            elif v.temperature_f and v.temperature_f > 103.5:
                triggered_rules.append({
                    "id": "RF_VITALS_TEMP",
                    "category": "HYPERPYREXIA",
                    "keyword_matched": f"Temp: {v.temperature_f}°F",
                    "severity": "EMERGENCY",
                    "action": "Immediate antipyretic care & cooling protocol required to prevent febrile seizures or heat injury.",
                    "description": f"Dangerous high fever ({v.temperature_f}°F)."
                })
                vitals_warning = f"Hyperpyrexia Alert: Body temperature is {v.temperature_f}°F"
            elif v.bp_systolic and (v.bp_systolic > 180 or v.bp_systolic < 85):
                triggered_rules.append({
                    "id": "RF_VITALS_BP",
                    "category": "HEMODYNAMIC_INSTABILITY",
                    "keyword_matched": f"BP: {v.bp_systolic} mmHg",
                    "severity": "EMERGENCY",
                    "action": "Immediate cardiovascular evaluation required for severe hypertensive crisis / hypotension.",
                    "description": f"Critical blood pressure level ({v.bp_systolic} mmHg Systolic)."
                })

        # Check Keyword Red Flags
        for rule in self.rules:
            for keyword in rule.keywords:
                if keyword in combined_text:
                    triggered_rules.append({
                        "id": rule.id,
                        "category": rule.category,
                        "keyword_matched": keyword,
                        "severity": rule.severity,
                        "action": rule.action,
                        "description": rule.description
                    })
                    break

        if triggered_rules:
            primary_action = triggered_rules[0]["action"]
            categories = [r["category"] for r in triggered_rules]
            return SafetyEngineResult(
                is_emergency=True,
                triggered_rules=triggered_rules,
                urgency="EMERGENCY",
                recommended_action=primary_action,
                requires_immediate_attention=True,
                escalation_reason=f"Emergency red flags detected in categories: {', '.join(categories)}",
                vitals_warning=vitals_warning
            )

        # High-risk moderate symptoms -> URGENT
        urgent_keywords = ["high fever", "severe pain", "vomiting blood", "blood in stool", "persistent vomiting", "kidney stone pain", "deep wound", "fracture"]
        is_urgent = any(uk in combined_text for uk in urgent_keywords) or structured_symptoms.severity.upper() == "SEVERE"

        if is_urgent:
            return SafetyEngineResult(
                is_emergency=False,
                triggered_rules=[],
                urgency="URGENT",
                recommended_action="Seek prompt clinical evaluation at your nearest Primary Health Centre (PHC), Community Health Centre (CHC), or outpatient clinic within 24 hours.",
                requires_immediate_attention=False,
                escalation_reason="Significant symptoms requiring prompt healthcare provider assessment."
            )

        # Default Routine
        return SafetyEngineResult(
            is_emergency=False,
            triggered_rules=[],
            urgency="ROUTINE",
            recommended_action="Schedule an appointment with a primary care practitioner or consult via teleconsultation for guidance.",
            requires_immediate_attention=False,
            escalation_reason=None
        )

safety_engine = DeterministicSafetyEngine()
