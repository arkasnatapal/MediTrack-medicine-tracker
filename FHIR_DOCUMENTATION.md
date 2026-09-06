# 🏥 MediTrack HL7 FHIR R4 (4.0.1) Interoperability Specification & Technical Guide

This document presents the complete technical architecture, entity mappings, REST API endpoints, security, validation, import/export, and offline synchronization mechanisms for the **HL7 FHIR R4 (4.0.1)** interoperability layer integrated across MediTrack.

---

## 1. System Overview

MediTrack's FHIR layer provides native, bi-directional translation between MediTrack's MongoDB database topology and the global **HL7 FHIR Release 4 (4.0.1)** healthcare data exchange standard. 

The FHIR engine operates locally without external cloud dependencies, enabling full interoperability for offline and rural healthcare deployments.

---

## 2. Comprehensive Entity Mapping Table

| MediTrack Entity | FHIR R4 Resource | Mapping Direction | Terminology System | Primary Identifiers |
|---|---|---|---|---|
| `User` / `PatientRecord` | `Patient` | Bi-directional | NRCES / ABDM | `https://meditrack.org/fhir/patient-id`, `https://abdm.gov.in/abha-number` |
| `Doctor` / `CareUser` | `Practitioner` | Bi-directional | V2-0203 (MD) | `https://medicalcouncil.in/` |
| `DoctorFacilityAssociation` | `PractitionerRole` | Bi-directional | PractitionerRole | `http://terminology.hl7.org/CodeSystem/practitioner-role` |
| `Facility` / `HealthcareFacility` | `Organization` | Bi-directional | Organization-Type | `https://abdm.gov.in/facility-registry` |
| `FacilityCapacity` / `Facility` | `Location` | Bi-directional | RoleCode (HOSP) | Bed Capacity Extension (`location-bed-capacity`) |
| `DailyStatus` / Vitals | `Observation` | Bi-directional | LOINC / UCUM | `http://loinc.org` (e.g. `8310-5`, `8480-6`, `2708-6`) |
| `Checkup` Diagnoses / Conditions | `Condition` | Bi-directional | SNOMED CT | `http://snomed.info/sct` (e.g. `59621000`, `44054006`) |
| `Medicine` / Prescription | `MedicationRequest` | Bi-directional | RxNorm / ATC | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| `MedicineCatalog` / Stock | `Medication` | Bi-directional | RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| Patient Logged Medicines | `MedicationStatement` | Bi-directional | RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| Patient Allergies | `AllergyIntolerance` | Bi-directional | SNOMED CT | `http://snomed.info/sct` (e.g. `373270004`) |
| `Report` / `CareDiagnosticOrder` | `DiagnosticReport` | Bi-directional | LOINC | `http://loinc.org` |
| Uploaded Reports / PDFs | `DocumentReference` | Bi-directional | LOINC | `http://loinc.org` (e.g. `11502-2`, `57833-6`) |
| `Appointment` / `CareAppointment` | `Appointment` | Bi-directional | V2-0276 | Participant References (`Patient`, `Practitioner`, `Location`) |
| `CareQueue` / Teleconsult / Admission | `Encounter` | Bi-directional | ActCode (AMB/EMER) | `http://terminology.hl7.org/CodeSystem/v3-ActCode` |
| `Referral` / `PatientTransfer` | `ServiceRequest` | Bi-directional | SNOMED CT / Text | `ServiceRequest` ID |
| Referral Emergency Lock | `Task` | Bi-directional | Task-Status | Task status progression (`requested` -> `accepted`) |
| AI Triage Recommendations | `CarePlan` | Bi-directional | US-Core Category | CarePlan Activities |
| Procedures & Interventions | `Procedure` | Bi-directional | SNOMED CT | `http://snomed.info/sct` |
| Vaccination Records | `Immunization` | Bi-directional | CVX | `http://hl7.org/fhir/sid/cvx` |
| Teleconsult Follow-up Messages | `Communication` | Bi-directional | Category | Sender/Recipient References |
| Family Guardians & Care Team | `CareTeam` | Bi-directional | RoleCode | Member References |
| Emergency Family Contacts | `RelatedPerson` | Bi-directional | RoleCode (FAMMEMB)| `http://terminology.hl7.org/CodeSystem/v3-RoleCode` |
| Health Score Targets | `Goal` | Bi-directional | LOINC | `39156-5` Health Score Target |
| ABDM Consent Requests | `Consent` | Bi-directional | ConsentScope | `http://terminology.hl7.org/CodeSystem/consentscope` |
| `AuditLog` / `CareAuditLog` | `AuditEvent` | Bi-directional | Audit-Event-Type | `http://terminology.hl7.org/CodeSystem/audit-event-type` |
| AI Provenance & Data Origin | `Provenance` | Bi-directional | ActReason | AI Triage vs Human Confirmed vs External Import |

---

## 3. FHIR REST API Directory

Base URL (Patient API): `http://localhost:5000/fhir`  
Base URL (Care API): `http://localhost:5001/fhir`

Headers:
- `Content-Type: application/fhir+json; charset=utf-8`
- `X-FHIR-Version: 4.0.1`

### Endpoints
1. `GET /fhir/Patient/:id` - Fetch FHIR Patient resource.
2. `POST /fhir/Patient` - Ingest/Create FHIR Patient resource.
3. `PUT /fhir/Patient/:id` - Update FHIR Patient resource.
4. `GET /fhir/Patient/:id/$everything` - Export complete Patient `$everything` Bundle containing all clinical history.
5. `GET /fhir/Observation/:id` - Fetch FHIR Observation.
6. `POST /fhir/Observation` - Create FHIR Observation.
7. `GET /fhir/Condition/:id` - Fetch FHIR Condition.
8. `POST /fhir/Condition` - Create FHIR Condition.
9. `GET /fhir/MedicationRequest/:id` - Fetch FHIR MedicationRequest.
10. `POST /fhir/MedicationRequest` - Create FHIR MedicationRequest.
11. `GET /fhir/AllergyIntolerance/:id` - Fetch FHIR AllergyIntolerance.
12. `GET /fhir/DiagnosticReport/:id` - Fetch FHIR DiagnosticReport.
13. `GET /fhir/DocumentReference/:id` - Fetch FHIR DocumentReference.
14. `GET /fhir/Appointment/:id` - Fetch FHIR Appointment.
15. `POST /fhir/Appointment` - Create FHIR Appointment.
16. `GET /fhir/Encounter/:id` - Fetch FHIR Encounter.
17. `POST /fhir/Encounter` - Create FHIR Encounter.
18. `GET /fhir/ServiceRequest/:id` - Fetch FHIR ServiceRequest (Referral).
19. `POST /fhir/ServiceRequest` - Create FHIR ServiceRequest.
20. `GET /fhir/Task/:id` - Fetch FHIR Task (Bed Lock).
21. `GET /fhir/CarePlan/:id` - Fetch FHIR CarePlan.
22. `GET /fhir/Practitioner/:id` - Fetch FHIR Practitioner.
23. `GET /fhir/Organization/:id` - Fetch FHIR Organization.
24. `GET /fhir/Location/:id` - Fetch FHIR Location.
25. `POST /fhir/Bundle/import` - Ingest external FHIR R4 JSON Bundle.
26. `GET /fhir/queue/pending` - Fetch pending offline synchronization items.
27. `POST /fhir/queue/sync` - Trigger synchronization of offline queue with external server.

---

## 4. Search Parameters

Search URL format: `GET /fhir/:resourceType?param=value`

Supported search parameters:
- `Patient?name=Ramesh`
- `Patient?identifier=14-8201-9304-8192`
- `Observation?patient=507f1f77bcf86cd799439011`
- `Condition?patient=507f1f77bcf86cd799439011`
- `Appointment?patient=507f1f77bcf86cd799439011`
- `ServiceRequest?patient=507f1f77bcf86cd799439011`

Search responses are returned as valid FHIR `Bundle` with `type: "searchset"`.

---

## 5. Automated Validation & Quality Assurance

All resources generated or imported by MediTrack pass through the standalone FHIR R4 validator (`backend/fhir/validators/fhirValidator.js`).

Validator checks:
1. `resourceType` against standard FHIR R4 specification types.
2. Required fields and mandatory structures.
3. Status enums (`active`, `completed`, `final`, `booked`, `requested`, etc.).
4. Data formats (ISO 8601 timestamps, quantities, UCUM units, LOINC codes, SNOMED CT codes).
5. Reference formats (`ResourceType/id`).

---

## 6. Offline Synchronization Architecture

For rural and low-connectivity deployments:
1. Transactions created offline are saved locally into MongoDB.
2. Operations generate `FhirSyncQueue` records marked as `QUEUED`.
3. When internet connectivity is restored, `POST /fhir/queue/sync` transfers queued items to external FHIR/ABDM endpoints.

---

## 7. Execution & Testing Commands

To run the automated FHIR test suite:
```powershell
node backend/tests/fhirTest.js
```
Or via npm:
```powershell
npm --prefix backend test
```

To test Python AI FHIR triage integration:
```powershell
python meditrack_ai/tests/run_tests.py
```
