# MediTrack AI Architecture Spec

## System Workflow Diagram

```
                 PATIENT NATURAL LANGUAGE INPUT
                               │
                               ▼
                    NLU & Symptom Extraction
                               │
                               ▼
               DETERMINISTIC SAFETY ENGINE (Priority #1)
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        RED FLAG DETECTED            NO RED FLAG DETECTED
                │                             │
                │                             ▼
                │                    Follow-up Questions
                │                    Medical RAG Retrieval
                │                    Model Explanation
                │                             │
                └──────────────┬──────────────┘
                               ▼
                     FINAL TRIAGE LEVEL
             (EMERGENCY / URGENT / ROUTINE)
                               │
                               ▼
                     CARE NAVIGATION
             (Facilities, 108/112, Appointments)
```

## Security & Safety Principles
1. **Deterministic Red-Flag Priority**: Deterministic rules always override LLM output. If chest pain, dyspnea, or stroke signs are detected, the output is enforced as `EMERGENCY`.
2. **Prompt Injection Defense**: Input messages are sanitized against instructions attempting to override safety guidelines.
3. **No Definitive Diagnosis**: Language explicitly avoids making clinical diagnoses, providing care-navigation recommendations instead.
4. **Privacy**: Patient symptom PII is never written to server logs.
