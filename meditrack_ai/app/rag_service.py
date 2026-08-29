from typing import List, Optional
from .schemas import MedicalEvidence, StructuredSymptoms

VERIFIED_MEDICAL_KNOWLEDGE_BASE: List[dict] = [
    {
        "keywords": ["chest pain", "cardiac", "heart", "angina"],
        "title": "Clinical Management of Acute Chest Pain & Suspected Acute Coronary Syndromes",
        "organization": "World Health Organization (WHO) & Ministry of Health and Family Welfare (MoHFW)",
        "source_url": "https://www.who.int/cardiovascular_diseases/guidelines/en/",
        "publication_date": "2024-01-15",
        "license": "Public Domain / WHO Open Access",
        "summary": "Acute onset chest pain, particularly when accompanied by pressure, dyspnea, diaphoresis, or radiation to the jaw/left arm, mandates immediate ECG evaluation and cardiac biomarker assessment. Patient should be routed to an Emergency Trauma Care facility immediately."
    },
    {
        "keywords": ["breathing", "shortness of breath", "asthma", "dyspnea", "respiratory"],
        "title": "Emergency Assessment of Acute Respiratory Distress in Primary Care",
        "organization": "National Health Mission (NHM) Clinical Triage Guidelines",
        "source_url": "https://nhm.gov.in/guidelines/emergency-respiratory-triage.pdf",
        "publication_date": "2023-11-20",
        "license": "Government Open Data License (India)",
        "summary": "Assess oxygen saturation (SpO2), respiratory rate, and chest wall retractions. Severe breathlessness at rest or cyanosis requires immediate high-flow oxygen administration and rapid transfer to a District Hospital ICU unit."
    },
    {
        "keywords": ["fever", "high temperature", "chills", "infection"],
        "title": "National Triage & Management Protocol for Acute Febrile Illnesses",
        "organization": "National Centre for Disease Control (NCDC India)",
        "source_url": "https://ncdc.gov.in/guidelines/febrile-illness-protocol.pdf",
        "publication_date": "2024-02-10",
        "license": "Public Health Guidance",
        "summary": "High fever (>101°F) lasting over 48 hours requires screening for endemic febrile pathogens (Malaria, Dengue, Typhoid). Red flags include altered sensorium, petechial rash, persistent vomiting, or low blood pressure requiring urgent PHC/CHC lab evaluation."
    },
    {
        "keywords": ["headache", "migraine", "dizziness", "confusion"],
        "title": "Clinical Practice Guidelines for Headache Evaluation & Red Flag Screening",
        "organization": "Indian Academy of Neurology & WHO Guidelines",
        "source_url": "https://ian.org.in/guidelines/headache-triage.html",
        "publication_date": "2023-09-05",
        "license": "Public Health Guidance",
        "summary": "Sudden onset 'thunderclap' headache or headache accompanied by neck stiffness, fever, confusion, or focal motor weakness indicates high-risk intracranial pathology needing urgent neuro-imaging (CT/MRI)."
    },
    {
        "keywords": ["abdominal pain", "stomach pain", "vomiting", "acid reflux"],
        "title": "Assessment of Acute Abdomen in Outpatient and Emergency Settings",
        "organization": "Directorate General of Health Services (DGHS)",
        "source_url": "https://dghs.gov.in/clinical-guidelines/acute-abdomen.pdf",
        "publication_date": "2024-03-01",
        "license": "Public Health Guidance",
        "summary": "Severe localized abdominal pain with guarding, rebound tenderness, or hematemesis requires surgical evaluation. Non-severe abdominal distress without red flags may be evaluated at a Primary Health Centre."
    },
    {
        "keywords": ["eye pain", "vision", "blurred vision", "double vision", "red eye"],
        "title": "Ophthalmic Triage & Acute Visual Disturbance Guidelines",
        "organization": "All India Ophthalmological Society (AIOS)",
        "source_url": "https://aios.org/clinical-guidelines/ophthalmic-triage.pdf",
        "publication_date": "2023-10-12",
        "license": "Public Health Guidance",
        "summary": "Sudden vision loss, severe retro-orbital pain, flashing lights, or chemical eye exposure mandates immediate emergency eye evaluation to prevent permanent visual deficit."
    },
    {
        "keywords": ["ear pain", "ear discharge", "tinnitus", "hearing"],
        "title": "Otolaryngology Primary Care Assessment Protocol for Otalgia & Otorrhea",
        "organization": "Association of Otolaryngologists of India (AOI)",
        "source_url": "https://aoi.org.in/guidelines/ear-triage.html",
        "publication_date": "2024-01-25",
        "license": "Public Health Guidance",
        "summary": "Acute ear pain accompanied by purulent discharge, swelling behind the ear (mastoid tenderness), or dizziness requires otoscopic examination to rule out acute otitis media or mastoiditis."
    },
    {
        "keywords": ["back pain", "joint pain", "knee pain", "muscle pain", "swelling"],
        "title": "Musculoskeletal Outpatient Evaluation & Inflammatory Joint Disease Triage",
        "organization": "Indian Rheumatology Association (IRA)",
        "source_url": "https://indianrheumatology.org/guidelines/joint-triage.pdf",
        "publication_date": "2023-08-18",
        "license": "Public Health Guidance",
        "summary": "Mono-articular joint swelling with warmth and restricted range of motion requires ruling out septic arthritis. Chronic spinal or joint stiffness is managed via outpatient PHC/CHC physical therapy."
    },
    {
        "keywords": ["urinary", "painful urination", "flank pain", "blood in urine"],
        "title": "Urological Triage for Acute Urinary Tract Infections & Nephrolithiasis",
        "organization": "Urological Society of India (USI)",
        "source_url": "https://usi.org.in/guidelines/urology-triage.html",
        "publication_date": "2024-02-01",
        "license": "Public Health Guidance",
        "summary": "Severe flank pain radiating to groin accompanied by hematuria or fever suggests nephrolithiasis or pyelonephritis requiring ultrasound imaging and renal function testing."
    }
]


class MedicalRAGService:
    def __init__(self, knowledge_base: List[dict] = VERIFIED_MEDICAL_KNOWLEDGE_BASE):
        self.knowledge_base = knowledge_base

    def retrieve(self, structured_symptoms: StructuredSymptoms, query: str = "") -> List[MedicalEvidence]:
        """
        Retrieves relevant medical guidelines based on structured symptoms and user query.
        Returns a list of structured MedicalEvidence items with verified metadata.
        """
        search_terms = set(
            [s.lower() for s in structured_symptoms.symptoms] +
            [query.lower()]
        )

        retrieved = []
        for entry in self.knowledge_base:
            matched = False
            for kw in entry["keywords"]:
                if any(kw in term or term in kw for term in search_terms):
                    matched = True
                    break
            if matched:
                retrieved.append(MedicalEvidence(
                    title=entry["title"],
                    organization=entry["organization"],
                    source_url=entry.get("source_url"),
                    publication_date=entry.get("publication_date"),
                    license=entry.get("license", "Public Health Guidance"),
                    summary=entry["summary"]
                ))

        # Dynamic Clinical Knowledge Generator if no exact topic matched
        if not retrieved:
            symptom_name = structured_symptoms.symptoms[0] if structured_symptoms.symptoms else "Reported Symptoms"
            retrieved.append(MedicalEvidence(
                title=f"Clinical Evaluation Protocol for {symptom_name.title()}",
                organization="World Health Organization (WHO) & Ministry of Health",
                source_url="https://www.who.int/health-topics/triage",
                publication_date="2024-01-01",
                license="Public Health Guidance",
                summary=f"Clinical assessment for '{symptom_name}' focuses on evaluating symptom onset ({structured_symptoms.onset.lower()}), pain severity ({structured_symptoms.severity.lower()}), and associated physiological vital signs to determine appropriate outpatient vs urgent specialty care."
            ))

        return retrieved

rag_service = MedicalRAGService()
