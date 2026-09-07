# MediTrack — FHIR Architecture Specification

## 1. Standard Selection

MediTrack implements the **HL7 FHIR Release 4 (4.0.1)** standard.

- **Content-Type**: `application/fhir+json; charset=utf-8`
- **Specification Version**: `4.0.1`
- **Header**: `X-FHIR-Version: 4.0.1`

---

## 2. Core Resource Coverage & Mapping

MediTrack implements bi-directional translation for **20 core FHIR R4 resources**:

| MediTrack Entity | FHIR Resource | Primary Coding System | Sample Code / LOINC |
|---|---|---|---|
| Demographic Profile | `Patient` | ABDM / Local SSN | `https://meditrack.org/fhir/patient-id` |
| Doctor / Practitioner | `Practitioner` | State Medical Council | `http://terminology.hl7.org/CodeSystem/v2-0203` |
| Doctor-Facility Association | `PractitionerRole` | HL7 PractitionerRole | `http://terminology.hl7.org/CodeSystem/practitioner-role` |
| Hospital / Health Facility | `Organization` | Facility Registry | `https://abdm.gov.in/facility-registry` |
| Hospital Ward / Bed / Room | `Location` | HL7 RoleCode | Bed Capacity Extension (`location-bed-capacity`) |
| Clinical Visit / Queue Token | `Encounter` | ActCode (AMB/EMER/IMP) | `http://terminology.hl7.org/CodeSystem/v3-ActCode` |
| Vitals / Symptoms / Lab Values | `Observation` | LOINC / UCUM | `8310-5` (Temp), `8480-6` (Systolic BP) |
| Diagnoses / Medical Conditions | `Condition` | SNOMED CT / ICD-10 | `59621000` (Essential Hypertension) |
| Known Patient Allergies | `AllergyIntolerance` | SNOMED CT | `373270004` (Penicillin allergy) |
| Drug Master Catalog Item | `Medication` | RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| Prescription / Medication Order | `MedicationRequest` | RxNorm | `http://www.nlm.nih.gov/research/umls/rxnorm` |
| Lab Test Results | `DiagnosticReport` | LOINC | `http://loinc.org` |
| Surgical / Clinical Procedure | `Procedure` | SNOMED CT | `http://snomed.info/sct` |
| Doctor Appointment Slot | `Appointment` | HL7 v2-0276 | `http://terminology.hl7.org/CodeSystem/v2-0276` |
| AI Triage / Care Plan | `CarePlan` | US Core Category | CarePlan activities |
| Inter-Facility Referral Request | `ServiceRequest` | SNOMED CT | `ServiceRequest` ID |
| Clinical PDF / Uploaded Document | `DocumentReference` | LOINC | `11502-2` (Laboratory report) |
| Family Guardian / Emergency Contact | `RelatedPerson` | HL7 RoleCode | `http://terminology.hl7.org/CodeSystem/v3-RoleCode` |
| Medical Equipment / Sensor | `Device` | FDA GUDID | `http://hl7.org/fhir/device-kind` |
| Vaccine Administration Record | `Immunization` | CVX | `http://hl7.org/fhir/sid/cvx` |

---

## 3. Validation & Error Handling

All incoming FHIR resources submitted via `POST` or `PUT` are passed through the MediTrack FHIR Validator:
1. **Structure Verification**: Ensures `resourceType` exists and required top-level elements (e.g. `patient` reference in `Observation`, `status` in `Encounter`) are present.
2. **Coding Validation**: Validates `system` and `code` properties within `CodeableConcept` objects.
3. **Error Response**: On validation failure, the API returns HTTP 400 Bad Request with an HL7 FHIR **`OperationOutcome`** payload instead of generic JSON.

### Sample `OperationOutcome` Response
```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "required",
      "details": {
        "text": "Missing required element 'subject' in Observation resource."
      },
      "expression": ["Observation.subject"]
    }
  ]
}
```

---

## 4. Patient `$everything` Bundle Export

The system supports exporting a complete clinical bundle for any patient via:
`GET /fhir/Patient/{id}/$everything`

This returns a FHIR **`Bundle`** (type: `searchset`) aggregating:
- `Patient` resource
- All `Observation` records
- All `Condition` records
- All `MedicationRequest` orders
- All `Encounter` visits
- All `DiagnosticReport` lab results
- All `Appointment` records
