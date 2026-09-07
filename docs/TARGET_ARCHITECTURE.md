# MediTrack — Target Interoperability Platform Architecture

## 1. High-Level Vision

MediTrack is transformed into an **API-First, FHIR-Native Healthcare Interoperability Platform**.

Rather than replacing existing EHR/HIS/LIS systems used in hospitals, MediTrack acts as a secure, standardized middleware layer. Hospitals, clinics, diagnostic laboratories, public health monitoring systems, and patient apps connect through standard APIs (**HL7 FHIR R4**) and MediTrack REST APIs (`/api/v1`).

```text
                                MEDITRACK INTEROPERABILITY PLATFORM
                                                 |
                 +-------------------------------+-------------------------------+
                 |                                                               |
        Personal App (frontend:3000)                               Care App (care_frontend:5173)
                 |                                                               |
                 +-------------------------------+-------------------------------+
                                                 |
                                    MediTrack API Gateway (/api/v1)
                                    & HL7 FHIR R4 Engine (/fhir)
                                      [ interop_backend:5002 ]
                                                 |
                  +------------------------------+------------------------------+
                  |                              |                              |
          Business Services                 FHIR Engine                 Integration Engine
        (Patients, Encounters,             (20+ Resources,             (OAuth2, RBAC, Webhooks,
         Triage, Vitals, Care)            Search, Mappers)             AuditLogs, Terminology)
                  |                              |                              |
                  +------------------------------+------------------------------+
                                                 |
                                         MongoDB / PostgreSQL
                                     (Isolated Multi-Tenant DB)
                                                 |
            +------------------------------------+------------------------------------+
            |                                    |                                    |
      Mock Hospital HIS                  Developer Portal &                   External HIS /
       (mock_his:5175)                     FHIR Explorer                     Lab Systems /
     [EHR / Lab Simulator]              (interop_frontend:5174)                 Clinics
```

---

## 2. Platform Architecture Layers

### Layer 1: Access & Application Interfaces
- **Personal Health Record App** (`frontend`): Patient portal for viewing permitted records, tracking prescriptions, logging vitals.
- **Care Network Operations Dashboard** (`care_frontend`): Clinician dashboard for hospital bed management, queues, referrals, and teleconsultation.
- **Developer Portal & Interactive FHIR Explorer** (`interop_frontend`): Administrative control center for managing OAuth API credentials, registering webhooks, exploring live FHIR resources, and testing APIs in a sandbox.
- **Mock Hospital HIS** (`mock_his`): Simulated third-party hospital software demonstrating automated FHIR data syncing.

### Layer 2: API Gateway & Security Core (`interop_backend:5002`)
- **HL7 FHIR R4 Engine** (`/fhir/...`): Standards-compliant RESTful FHIR server supporting 20+ resources, search parameters, validation, and `$everything` bundle exports.
- **Developer REST Gateway** (`/api/v1/...`): Developer-friendly application API.
- **Multi-Tenant Authorization Engine**: Enforces strict `organizationId` data boundaries and granular Role-Based Access Control (RBAC).
- **OAuth 2.0 & API Key Manager**: Handles client credentials flow (`/api/v1/auth/token`), issuing signed JWTs for external integrations.
- **Webhook Dispatcher**: Signs outbound webhook payloads using HMAC-SHA256 and manages retries/delivery logs.
- **Audit & Consent Engine**: Records HIPAA-compliant `AuditEvent` entries for all accesses and enforces patient consent preferences.

### Layer 3: Unified Data Layer
- **Multi-Tenant Relational / Document Store**: Stores organizations, clients, consent rules, audit logs, and unified clinical data linked via standardized FHIR resource IDs.

---

## 3. Data Flow Example

1. **Hospital HIS Entry**: A clinician at "Apollo Metro Hospital" enters a vital sign reading in `mock_his`.
2. **FHIR Payload Transmission**: `mock_his` converts the record into an HL7 FHIR `Observation` resource and sends a `POST /fhir/Observation` request to `interop_backend:5002` with an OAuth 2.0 Bearer token.
3. **Validation & Security**: `interop_backend` validates token scopes (`observation.write`), checks tenant permissions (`organizationId`), and validates the FHIR payload against HL7 specifications.
4. **Storage & Audit**: The payload is stored in the database, and an `AuditEvent` log is generated.
5. **Webhook Firing**: An `observation.created` webhook event is dispatched to all subscribed listener endpoints.
6. **Unified Access**: The vital sign becomes instantly visible in the MediTrack FHIR Explorer, Care Operations Dashboard, and (if permitted by patient consent) the Patient App.
