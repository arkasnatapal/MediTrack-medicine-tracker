# MediTrack — Authentication Specification

## 1. Authentication Architecture

MediTrack Interoperability Platform uses **OAuth 2.0 Client Credentials Flow** for server-to-server integrations (Hospitals, EHRs, Labs) and **JWT (JSON Web Tokens)** for user sessions (Care staff, Patients, Administrators).

```text
  External System (HIS)                         MediTrack OAuth Gateway
          |                                                |
          | --- 1. POST /api/v1/auth/token --------------> |
          |     (client_id, client_secret)                 |
          |                                                |
          | <--- 2. Returns JWT Access Token ------------ |
          |     (expires_in: 3600s, scopes: [...])         |
          |                                                |
          | --- 3. GET /fhir/Patient/123 ----------------> |
          |     Header: Bearer <access_token>              |
```

---

## 2. OAuth 2.0 Client Credentials Flow

### Token Request
`POST /api/v1/auth/token`

**Request Body**:
```json
{
  "grant_type": "client_credentials",
  "client_id": "cli_apollo_metro_981273",
  "client_secret": "sec_89f7a62b109e432c8172b09a"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "patient/*.read observation/*.write encounter/*.read organization/read",
  "organization_id": "org_apollo_metro"
}
```

---

## 3. JWT Claims Payload

Decoded access tokens contain the following mandatory claims:
```json
{
  "sub": "cli_apollo_metro_981273",
  "org_id": "org_apollo_metro",
  "scopes": ["patient/*.read", "observation/*.write"],
  "roles": ["Integration Client"],
  "iat": 1757174400,
  "exp": 1757178000,
  "iss": "https://meditrack.org/interop"
}
```

---

## 4. API Key Verification

For quick developer testing in the Sandbox, an `X-API-Key` header is also supported:
`X-API-Key: mtk_sandbox_908127341`
