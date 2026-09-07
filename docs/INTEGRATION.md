# MediTrack — Hospital Integration Architecture

## 1. Generic Integration Workflow

Existing hospital EHR/HIS platforms connect to MediTrack through pluggable integration adapters.

```text
  Hospital HIS / EHR                        MediTrack Interoperability Platform
+--------------------+                      +------------------------------------+
| Local HIS Database |                      | MediTrack API Gateway              |
| (Oracle / SQL / DB)|                      | (interop_backend:5002)             |
+---------+----------+                      +-----------------+------------------+
          |                                                   |
          | 1. Export Record                                  |
          v                                                   |
+--------------------+   2. Post FHIR Resource                |
|  HIS Integration   | -------------------------------------> |
|  Adapter (Plugin)  |   POST /fhir/Observation               |
+--------------------+                                        |
          ^                                                   |
          | 3. Webhook Event Notification                     |
          +-------------------------------------------------- +
            "encounter.created" payload
```

---

## 2. Pluggable Adapter Formats

1. **HL7 FHIR R4 (Preferred Native Interface)**: External system formats payload as standard FHIR R4 JSON and posts to `/fhir/:resourceType`.
2. **REST API (`/api/v1`)**: Simplified JSON endpoints for systems without native FHIR support.
3. **HL7 v2 Message Adapter (Architecture Ready)**: Pluggable translation pipeline for converting legacy HL7 v2.x (ADT, ORU, ORM) messages into FHIR R4 resources.
4. **Batch Import Interface**: Post `Bundle` payloads to `/fhir/Bundle/import` for multi-record syncing.

---

## 3. Step-by-Step Hospital Onboarding Guide

1. **Register Organization**: Platform Admin registers the healthcare facility (e.g. "Apollo Metro Hospital").
2. **Generate API Credentials**: Issue `client_id` and `client_secret` in the Developer Portal.
3. **Configure Scopes**: Grant integration permissions (`patient/*.read`, `observation/*.write`).
4. **Setup Webhooks**: Register hospital listener URL to receive real-time updates.
5. **Test in Sandbox**: Execute sample requests against the Sandbox environment.
6. **Promote to Production**: Switch endpoint base URL to production gateway.
