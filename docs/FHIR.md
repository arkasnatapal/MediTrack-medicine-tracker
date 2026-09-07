# MediTrack — HL7 FHIR R4 API Directory (`/fhir`)

The MediTrack FHIR API provides standards-compliant endpoints conforming strictly to the **HL7 FHIR Release 4 (4.0.1)** specification.

---

## Base URL
`http://localhost:5002/fhir`

---

## Standard Headers
- `Content-Type: application/fhir+json; charset=utf-8`
- `Accept: application/fhir+json`
- `X-FHIR-Version: 4.0.1`
- `Authorization: Bearer <access_token>`

---

## Supported Endpoints & Operations

| HTTP Method | Endpoint Path | Description | Supported Search Params |
|---|---|---|---|
| `GET` | `/fhir/Patient` | Search Patient resources | `name`, `identifier`, `gender`, `birthdate` |
| `GET` | `/fhir/Patient/:id` | Read Patient by ID | — |
| `POST` | `/fhir/Patient` | Ingest/Create new FHIR Patient | — |
| `PUT` | `/fhir/Patient/:id` | Update FHIR Patient | — |
| `GET` | `/fhir/Patient/:id/$everything` | Export complete patient clinical history bundle | — |
| `GET` | `/fhir/Practitioner/:id` | Read Practitioner (Doctor) resource | `name`, `identifier` |
| `POST` | `/fhir/Practitioner` | Create Practitioner resource | — |
| `GET` | `/fhir/PractitionerRole/:id` | Read PractitionerRole association | `practitioner`, `organization` |
| `GET` | `/fhir/Organization/:id` | Read Organization resource | `name`, `type` |
| `POST` | `/fhir/Organization` | Create Organization resource | — |
| `GET` | `/fhir/Location/:id` | Read Location (Facility unit/bed) | `organization`, `status` |
| `GET` | `/fhir/Encounter` | Search Encounter visits | `patient`, `status`, `date`, `type` |
| `GET` | `/fhir/Encounter/:id` | Read Encounter resource | — |
| `POST` | `/fhir/Encounter` | Create Encounter resource | — |
| `GET` | `/fhir/Observation` | Search Observation records | `patient`, `code`, `category`, `date` |
| `GET` | `/fhir/Observation/:id` | Read Observation resource | — |
| `POST` | `/fhir/Observation` | Ingest vital sign / lab observation | — |
| `GET` | `/fhir/Condition` | Search Condition records | `patient`, `clinical-status` |
| `POST` | `/fhir/Condition` | Record diagnosis / condition | — |
| `GET` | `/fhir/AllergyIntolerance` | Search Patient allergies | `patient`, `type` |
| `GET` | `/fhir/MedicationRequest` | Search Prescription orders | `patient`, `status`, `intent` |
| `POST` | `/fhir/MedicationRequest` | Issue prescription order | — |
| `GET` | `/fhir/DiagnosticReport` | Search Lab Diagnostic Reports | `patient`, `status`, `code` |
| `POST` | `/fhir/DiagnosticReport` | Ingest Diagnostic Report | — |
| `GET` | `/fhir/Appointment` | Search Appointments | `patient`, `practitioner`, `date`, `status` |
| `POST` | `/fhir/Appointment` | Schedule Appointment | — |
| `GET` | `/fhir/ServiceRequest` | Search Referrals / Orders | `patient`, `intent`, `status` |
| `POST` | `/fhir/ServiceRequest` | Create Service Request | — |
| `GET` | `/fhir/DocumentReference` | Search Uploaded Documents | `patient`, `type`, `date` |
| `GET` | `/fhir/CarePlan/:id` | Read Care Plan resource | `patient`, `category` |
| `POST` | `/fhir/Bundle/import` | Ingest external FHIR R4 JSON Bundle | — |

---

## Error Handling Pattern

Validation or syntax errors return an HL7 FHIR `OperationOutcome` object with HTTP status 400 or 422:

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "details": {
        "text": "Invalid code system for Observation.code"
      }
    }
  ]
}
```
