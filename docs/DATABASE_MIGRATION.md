# MediTrack — Multi-Tenant Database Architecture & Migration Guide

## 1. Database Model Strategy

MediTrack uses MongoDB Atlas / Mongoose with multi-tenant data indexing across all core collections.

```text
Collection: Patients
{
  "_id": ObjectId("65f1a2b3c4..."),
  "organizationId": ObjectId("65f100000000000000000001"), // Multi-Tenant Partition Key
  "fhirId": "Patient-89123",
  "name": [{ "text": "Ananya Sharma", "family": "Sharma", "given": ["Ananya"] }],
  "gender": "female",
  "birthDate": "1994-05-14",
  "meta": { "lastUpdated": "2026-09-06T18:00:00Z" }
}
```

---

## 2. Organization Multi-Tenancy Indexing

To ensure zero cross-tenant query leaks and fast lookup times, compound indices are created on all clinical collections:
- `db.patients.createIndex({ organizationId: 1, fhirId: 1 }, { unique: true })`
- `db.observations.createIndex({ organizationId: 1, fhirId: 1 })`
- `db.encounters.createIndex({ organizationId: 1, fhirId: 1 })`
- `db.auditlogs.createIndex({ organizationId: 1, timestamp: -1 })`

---

## 3. Migration Guidelines

1. **Schema Preservation**: Existing MongoDB collections (`users`, `medicines`, `facilities`, `queues`) remain intact.
2. **Soft Field Addition**: New platform fields (`organizationId`, `fhirId`, `meta`) are added with default fallback values during query time.
3. **Migration Scripts**: Standalone migration scripts in `interop_backend/scratch/migrateTenants.js` assign default organization IDs to legacy un-partitioned records.
