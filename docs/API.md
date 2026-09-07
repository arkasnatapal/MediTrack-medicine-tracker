# MediTrack — Developer API Specification (`/api/v1`)

The MediTrack Developer API (`/api/v1`) provides developer-friendly REST endpoints for application workflows that complement the standard `/fhir` interface.

---

## Base URL
`http://localhost:5002/api/v1`

---

## Authentication & Headers
All requests must include:
- `Authorization: Bearer <access_token>`
- `X-Organization-ID: <organization_id>`
- `Content-Type: application/json`

---

## Endpoints Overview

### 1. Authentication & OAuth
- `POST /api/v1/auth/token` — Exchange OAuth 2.0 client credentials (`client_id`, `client_secret`) for a signed JWT access token.
- `GET /api/v1/auth/me` — Inspect current authenticated client details and authorized scopes.

### 2. Patient Management
- `GET /api/v1/patients` — List patients accessible to the organization (supports `name`, `identifier` query parameters).
- `GET /api/v1/patients/:id` — Retrieve patient detail.
- `POST /api/v1/patients` — Register a new patient.
- `PUT /api/v1/patients/:id` — Update patient demographics.

### 3. Clinical Encounters
- `GET /api/v1/encounters` — List medical encounters (supports `patientId`, `status`, `date`).
- `POST /api/v1/encounters` — Create a new clinical encounter.

### 4. Observations & Vitals
- `GET /api/v1/observations` — Query vitals/observations for a patient.
- `POST /api/v1/observations` — Record vital signs (blood pressure, temperature, heart rate, O2, glucose).

### 5. Prescriptions & Medications
- `GET /api/v1/medications` — List medication requests for a patient.
- `POST /api/v1/medications` — Create a new prescription/medication request.

### 6. AI Clinical Triage
- `POST /api/v1/triage` — Submit symptoms for AI analysis. Returns risk classification (`EMERGENCY`, `URGENT`, `ROUTINE`), recommended actions, and explicitly tags output as **AI-Generated Assessment**.

### 7. Organizations & Facilities
- `GET /api/v1/organizations` — List registered organizations.
- `GET /api/v1/organizations/:id` — Retrieve organization details.

### 8. Webhooks Management
- `GET /api/v1/webhooks` — List registered webhook subscriptions.
- `POST /api/v1/webhooks` — Register a new webhook endpoint (`url`, `events`, `secret`).
- `DELETE /api/v1/webhooks/:id` — Remove a webhook subscription.

### 9. Sandbox & Test Data
- `POST /api/v1/sandbox/reset` — Reset organization test data to initial synthetic state.
- `POST /api/v1/sandbox/seed` — Seed demo patients, vitals, encounters, and lab reports.
