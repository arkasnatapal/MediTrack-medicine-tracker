"""
FHIR R4 Adapter for MediTrack AI Triage Engine.
Converts deterministic safety engine triage evaluations into standard FHIR R4 resources
including Observation, ClinicalImpression, CarePlan, ServiceRequest, Task, and Provenance.
"""

from typing import Dict, Any, List
import datetime
import uuid

def convert_triage_to_fhir_bundle(triage_result: Dict[str, Any], patient_id: str = "patient-demo") -> Dict[str, Any]:
    """
    Translates a MediTrack AI Triage evaluation result into an HL7 FHIR R4 Bundle.
    Deterministic safety determinations remain authoritative.
    """
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    bundle_id = f"bundle-triage-{uuid.uuid4().hex[:8]}"

    urgency = triage_result.get("risk_category") or triage_result.get("urgency") or "ROUTINE"
    recommendation = triage_result.get("action") or triage_result.get("recommendation") or "Routine Evaluation"
    red_flags = triage_result.get("red_flags") or []
    summary = triage_result.get("summary") or triage_result.get("ai_clinical_summary") or "Triage Assessment"

    # 1. Observation Resource for Symptoms
    obs_id = f"obs-triage-{uuid.uuid4().hex[:8]}"
    symptom_obs = {
        "resourceType": "Observation",
        "id": obs_id,
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "survey",
                        "display": "Survey / Self-Reported Symptoms"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "8684-3",
                    "display": "Triage note"
                }
            ],
            "text": "Reported Clinical Symptoms"
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "effectiveDateTime": now_iso,
        "valueString": f"Urgency: {urgency}. Symptoms: {', '.join(red_flags) if red_flags else 'General discomfort'}",
        "note": [{"text": summary}]
    }

    # 2. ClinicalImpression Resource
    imp_id = f"imp-triage-{uuid.uuid4().hex[:8]}"
    clinical_impression = {
        "resourceType": "ClinicalImpression",
        "id": imp_id,
        "status": "completed",
        "code": {
            "text": f"Triage Assessment: Risk Tier {urgency}"
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "effectiveDateTime": now_iso,
        "summary": summary,
        "finding": [
            {
                "itemCodeableConcept": {
                    "text": rf
                }
            } for rf in red_flags
        ]
    }

    # 3. CarePlan Resource
    cp_id = f"cp-triage-{uuid.uuid4().hex[:8]}"
    care_plan = {
        "resourceType": "CarePlan",
        "id": cp_id,
        "status": "active",
        "intent": "plan",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://hl7.org/fhir/us/core/CodeSystem/careplan-category",
                        "code": "assess-plan",
                        "display": "Triage Action Plan"
                    }
                ]
            }
        ],
        "title": f"Triage Plan ({urgency})",
        "description": recommendation,
        "subject": {"reference": f"Patient/{patient_id}"},
        "created": now_iso,
        "activity": [
            {
                "detail": {
                    "description": recommendation,
                    "status": "in-progress"
                }
            }
        ]
    }

    # 4. ServiceRequest Resource (if referral / emergency consultation recommended)
    sr_id = f"sr-triage-{uuid.uuid4().hex[:8]}"
    priority = "stat" if urgency in ["RED", "EMERGENCY"] else "urgent" if urgency in ["YELLOW", "URGENT"] else "routine"
    service_request = {
        "resourceType": "ServiceRequest",
        "id": sr_id,
        "status": "active",
        "intent": "proposal",
        "priority": priority,
        "code": {
            "text": f"Recommended Referral: {recommendation}"
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "authoredOn": now_iso,
        "reasonCode": [{"text": summary}]
    }

    # 5. Provenance Resource (Tagging AI & Deterministic Safety Engine)
    prov_id = f"prov-triage-{uuid.uuid4().hex[:8]}"
    provenance = {
        "resourceType": "Provenance",
        "id": prov_id,
        "target": [
            {"reference": f"Observation/{obs_id}"},
            {"reference": f"CarePlan/{cp_id}"},
            {"reference": f"ServiceRequest/{sr_id}"}
        ],
        "recorded": now_iso,
        "reason": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ActReason",
                        "code": "AI_DETERMINISTIC_TRIAGE",
                        "display": "Deterministic Safety Engine Evaluation"
                    }
                ]
            }
        ],
        "agent": [
            {
                "type": {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                            "code": "AUT",
                            "display": "MediTrack AI Safety Engine"
                        }
                    ]
                },
                "who": {
                    "display": "MediTrack Deterministic Clinical Safety Engine v1.0"
                }
            }
        ]
    }

    bundle = {
        "resourceType": "Bundle",
        "id": bundle_id,
        "type": "collection",
        "timestamp": now_iso,
        "entry": [
            {"fullUrl": f"Observation/{obs_id}", "resource": symptom_obs},
            {"fullUrl": f"CarePlan/{cp_id}", "resource": care_plan},
            {"fullUrl": f"ServiceRequest/{sr_id}", "resource": service_request},
            {"fullUrl": f"Provenance/{prov_id}", "resource": provenance}
        ]
    }

    return bundle
