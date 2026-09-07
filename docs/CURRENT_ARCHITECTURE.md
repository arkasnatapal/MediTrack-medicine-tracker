# MediTrack — Current Architecture Audit

This document provides a comprehensive audit of the existing MediTrack codebase prior to the interoperability platform expansion.

---

## 1. Executive Summary

MediTrack is currently composed of 5 distinct active sub-applications:
1. `backend`: Node.js + Express + Mongoose (Port 5000) - Personal health-record API backend.
2. `frontend`: React + Vite / CRA (Port 3000) - Patient/personal health record web interface.
3. `care_backend`: Node.js + Express + Mongoose (Port 5001) - Healthcare provider / hospital care network backend.
4. `care_frontend`: React + Vite (Port 5173 / 3001) - Hospital operations, queue, referral, and teleconsultation dashboard.
5. `meditrack_ai`: Python + FastAPI (Port 8001) - Clinical triage engine, symptom analyzer, and FHIR translation adapter.

---

## 2. Infrastructure & Technology Stack

| Domain | Technology | Details |
|---|---|---|
| **Primary Backend** | Node.js (v18+) / Express 4.19 | Handles REST APIs, JSON parsing, file uploads, JWT authentication |
| **AI Backend** | Python 3.14 / FastAPI 0.110 | Uvicorn server running Gemini / local AI models on port 8001 |
| **Database Layer** | MongoDB Atlas / Mongoose 8.4 | Cloud MongoDB cluster storing users, records, vitals, facilities, queues |
| **Secondary DB / Storage** | Supabase & Cloudinary | File storage for reports, medical images, and OCR outputs |
| **Realtime Video / Chat** | LiveKit Server SDK 2.18 | Teleconsultation rooms and provider-patient video calls |
| **Healthcare Standard** | HL7 FHIR Release 4 (4.0.1) | Native JSON resource structures with LOINC and SNOMED CT encodings |

---

## 3. Data Models & Schemas

### `backend/models` (Personal App)
- `User`: Personal demographics, auth hash, ABHA card data, emergency contact references.
- `Medicine`, `MedicineCatalog`, `MedicineInventory`, `MedicineLog`: Prescription tracking, drug lookup cache, dosage logs, stock level warnings.
- `DailyStatus`: Vitals recording (blood pressure, temperature, heart rate, O2 saturation, blood glucose).
- `Report`: Uploaded lab PDFs, diagnostic images, OCR text extractions.
- `FamilyConnection`: Permitted family member access to patient records.
- `AbdmConsentRequest`: ABDM consent artifact logs.

### `care_backend/models` (Care Network)
- `Facility`: Hospital / clinic / health center metadata, emergency capacity, beds available.
- `Doctor`: Practitioner profile, license ID, specialization, facility associations.
- `DoctorFacilityAssociation`: PractitionerRole mapping to facilities.
- `Patient`: Provider-registered patient index.
- `Appointment`: Scheduled visits, provider slot allocations.
- `Queue`: Outpatient clinic waiting queue, token numbers.
- `Referral` & `PatientTransfer`: Inter-facility transfer orders and bed lock tasks.
- `DiagnosticOrder`: Lab test requests and diagnostic status.

---

## 4. Current API Route Mapping

### `backend/routes`
- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/medicine`, `POST /api/medicine`
- `POST /api/daily-status` (Vitals entry)
- `GET /api/abdm` (ABDM profile & consent flow)
- `POST /api/ai/triage` (Sends symptoms to `meditrack_ai`)
- `GET /fhir/:resourceType` (FHIR R4 Patient facade)

### `care_backend/routes`
- `POST /api/auth/login` (Provider login)
- `GET /api/facilities`, `POST /api/facilities`
- `GET /api/doctors`, `POST /api/doctors`
- `GET /api/appointments`, `POST /api/appointments`
- `GET /api/queues`, `POST /api/queues`
- `POST /api/referrals` (Transfer requests between hospitals)
- `POST /api/teleconsultations` (LiveKit session generation)

---

## 5. Architectural Findings & Key Insights

1. **Duplication Between Apps**: `backend` and `care_backend` maintain separate `User`, `Appointment`, and `Report` models in the same MongoDB cluster.
2. **Standardization Opportunity**: Hospital care workflows (`care_backend`) and personal health logs (`backend`) must communicate through a single standardized HL7 FHIR R4 interoperability layer.
3. **Multi-Tenancy Requirement**: Facilities currently share space in MongoDB collections; explicit `organizationId` isolation is needed for security.
4. **Safety Verification**: Existing services (`backend`, `care_backend`, `frontend`, `care_frontend`, `meditrack_ai`) are running synchronously on ports 5000, 5001, 3000, 5173, and 8001. All new interoperability platform services must execute independently in isolated folders (`interop_backend`, `interop_frontend`, `mock_his`).
