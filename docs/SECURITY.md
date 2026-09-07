# MediTrack — Security & Privacy Controls Specification

## 1. Security Architecture Controls

```text
                  Incoming API Request
                           |
            +--------------v--------------+
            |      HTTPS / TLS 1.3        |
            +--------------+--------------+
                           |
            +--------------v--------------+
            |   CORS & Rate Limiting      | (100 req/min/IP)
            +--------------+--------------+
                           |
            +--------------v--------------+
            | JWT / OAuth Token Validator |
            +--------------+--------------+
                           |
            +--------------v--------------+
            |  Tenant Isolation & RBAC    |
            +--------------+--------------+
                           |
            +--------------v--------------+
            | FHIR Validation & Sanitizer | (NoSQL / XSS Injection Protect)
            +--------------+--------------+
                           |
            +--------------v--------------+
            |  Audited Database Operation | (AuditEvent Created)
            +-----------------------------+
```

---

## 2. Technical Controls Summary

1. **Transport Encryption**: HTTPS / TLS 1.3 enforced for all external endpoints.
2. **Rate Limiting**: Express rate-limiting middleware configured to prevent brute force (100 requests per minute per IP).
3. **CORS Policy**: Configured to restrict origins to verified domains and local development ports.
4. **Input Sanitization**: Request bodies sanitized against NoSQL injection, XSS vectors, and path traversal attacks.
5. **Secrets Management**: Secrets loaded exclusively via environment variables (`.env`). No credentials committed to git.
6. **Audit Trails**: Non-repudiable audit logging (`AuditEvent`) for all record accesses, modifications, and deletions.
7. **Error Masking**: Production errors mask internal stack traces and database errors, returning structured FHIR `OperationOutcome` or standard JSON error format.

---

## 3. Compliance Considerations

| Control Category | Implemented Technical Control | Future Regulatory Roadmap |
|---|---|---|
| **Access Control** | OAuth 2.0, JWT, Granular RBAC, Tenant Isolation | Full ABDM M3 Provider Integration |
| **Audit Logging** | FHIR `AuditEvent` logging actor, action, timestamp, outcome | Immutable Audit Archiving (WORM) |
| **Patient Consent** | Consent evaluation engine (`ConsentRecord`) | Formal Patient Consent Revocation Portal |
| **Data Protection** | TLS in transit, Bcrypt password hashing | At-rest AES-256 field encryption |
