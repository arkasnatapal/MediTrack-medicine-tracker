# MediTrack Care Network - API Specification

Base URL: `http://localhost:5001/api`

## Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register-facility` - Register Healthcare Facility (`PENDING_VERIFICATION`).
- `POST /api/auth/register-doctor` - Register Doctor (`PENDING_VERIFICATION`).
- `POST /api/auth/login` - Universal provider login (Facility, Doctor, Admin).
- `GET /api/auth/me` - Get logged in profile.

### Facility Management (`/api/facilities`)
- `GET /api/facilities` - List verified facilities.
- `GET /api/facilities/:id` - Get facility details & bed capacity.
- `PUT /api/facilities/:id/capacity` - Update bed & ICU capacity.

### Doctor-Facility Associations (`/api/facility-doctors`)
- `GET /api/facility-doctors` - List doctor-facility associations.
- `POST /api/facility-doctors/request` - Invite or request association.
- `PUT /api/facility-doctors/:id/status` - Approve, reject, suspend association.

### Appointments & Queue (`/api/appointments`, `/api/queues`)
- `GET /api/appointments` - List facility/doctor appointments.
- `POST /api/appointments` - Book appointment.
- `PUT /api/appointments/:id/status` - Update status & issue prescription.
- `GET /api/queues` - Get live queue token state.
- `POST /api/queues/checkin` - Patient check-in & token issue.
- `POST /api/queues/action` - Doctor advance queue (NEXT, COMPLETE, SKIP).

### Referrals (`/api/referrals`)
- `POST /api/referrals` - Create inter-facility referral.
- `PUT /api/referrals/:id/status` - Accept or reject referral.

### Inter-Hospital Patient Transfers (`/api/transfers`)
- `POST /api/transfers` - Request emergency transfer with bed check.
- `PUT /api/transfers/:id/status` - Explicit ACCEPT, REJECT, or ADMIT transfer.

### Teleconsultation (`/api/teleconsultations`)
- `POST /api/teleconsultations/start` - Initialize live video session.
- `PUT /api/teleconsultations/:id/terminate` - Doctor terminates call (allocates 10 post-session messages).
- `POST /api/teleconsultations/:id/post-session-message` - Patient post-session follow-up message (text/audio).

### Diagnostics & Medicine Stock (`/api/diagnostics`, `/api/inventory`)
- `POST /api/diagnostics` - Order lab test.
- `PUT /api/diagnostics/:id/status` - Update lab order & upload report.
- `GET /api/inventory/public-search` - Public patient medicine availability query.
- `POST /api/inventory` - Add medicine stock item.

### Admin Controls (`/api/admin`)
- `GET /api/admin/pending` - List pending facilities and doctors.
- `PUT /api/admin/verify-facility/:id` - Verify / Reject / Suspend facility.
- `PUT /api/admin/verify-doctor/:id` - Verify / Reject / Suspend doctor.
- `GET /api/admin/audit-logs` - View security audit logs.
- `GET /api/admin/metrics` - System metrics.
