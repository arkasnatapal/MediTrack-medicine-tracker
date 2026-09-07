# MediTrack — Real-Time Webhooks & Event Framework

## 1. Webhook Overview

MediTrack provides real-time event notifications allowing external hospital HIS, lab systems, and clinic software to react instantly to clinical events without polling.

---

## 2. Event Types Catalog

| Event Name | Fired When | Sample Payload Summary |
|---|---|---|
| `patient.created` | New patient registered | Patient ID, demographic details, organization ID |
| `patient.updated` | Patient profile updated | Updated fields, revision timestamp |
| `encounter.created` | New visit / encounter recorded | Encounter ID, patient ID, status, class |
| `observation.created` | New vital sign or lab result logged | Observation ID, LOINC code, numeric value, unit |
| `diagnostic_report.created` | New lab diagnostic report uploaded | Report ID, conclusion, status |
| `appointment.created` | Appointment slot booked | Appointment ID, time, practitioner |
| `triage.completed` | Symptom triage assessment done | Triage risk score, category, timestamp |

---

## 3. Webhook Delivery & Security

### HMAC Signature Header
Every outbound webhook HTTP request contains an HMAC-SHA256 signature header computed using the client's webhook secret key:
`X-MediTrack-Signature: sha256=a5b6c7d8e9...`

### Verification Example (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payloadString, signatureHeader, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = 'sha256=' + hmac.update(payloadString).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}
```

---

## 4. Retries & Delivery Logs

- **Retry Policy**: Exponential backoff retry scheme (3 attempts: 5s, 30s, 300s) on non-2xx responses.
- **Idempotency Header**: Includes unique `X-Event-ID` header to prevent duplicate processing.
- **Delivery Logs**: Delivery attempts, HTTP status codes, and latency are recorded in `WebhookDeliveryLog` and visible in the Developer Portal.
