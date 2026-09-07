# MediTrack — Authorization & Access Control Specification

## 1. Role-Based Access Control (RBAC)

MediTrack defines granular roles across the platform:

| Role | Permitted Actions | Accessible Resources |
|---|---|---|
| **Platform Admin** | System management, organization registration, client management, audit log review | All platform resources across organizations |
| **Organization Admin** | Facility user management, API keys, webhooks configuration | All resources within their registered organization |
| **Doctor** | Create/read encounters, prescribe medication, log vitals, request lab tests, view medical history | Authorized patient records within facility |
| **Nurse** | Read patient profile, record vital signs, view care queue, update encounter status | Authorized patient vitals & encounters |
| **Healthcare Worker** | Read patient demographics, record basic vitals | Basic patient info & vitals |
| **Receptionist** | Register patients, schedule appointments, issue queue tokens | Demographics, Appointments, Queue |
| **Lab Technician** | Create & update diagnostic reports, attach lab results | DiagnosticReport, DocumentReference |
| **Pharmacist** | Read prescriptions, update medication fulfillment status | MedicationRequest, Medication |
| **Patient** | View permitted personal records, vital logs, prescriptions, appointments | Personal patient records (Self) |
| **Integration Client** | Read/write clinical resources within authorized scopes | Organization-scoped FHIR resources |

---

## 2. Multi-Tenant Isolation Rule

- **Database-Level Filter**: Every database query enforced by the API gateway automatically includes `{ organizationId: req.user.org_id }`.
- **Cross-Tenant Access Rejection**: If Hospital A (`org_apollo`) requests a patient resource belonging exclusively to Hospital B (`org_fortis`), the system returns `403 Forbidden` with error code `TENANT_ACCESS_DENIED`.

---

## 3. Scopes & Permission Encodings

External integrations rely on SMART-on-FHIR style scope syntax:
- `patient/*.read` — Read all patient clinical resources.
- `observation/*.write` — Ingest vital signs and lab results.
- `encounter/*.write` — Record clinical encounters.
- `medication/*.write` — Issue prescriptions.
