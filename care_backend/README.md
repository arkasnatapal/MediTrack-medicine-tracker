# MediTrack Care Network - Provider Backend (`/care_backend`)

## Overview
`/care_backend` is the Node.js, Express, and LiveKit REST API & real-time media token server powering the **MediTrack Care Network** provider ecosystem. It coordinates healthcare facilities (PHCs, CHCs, Rural & District Hospitals, Diagnostic Laboratories), doctors, facility staff, and system administrators.

---

## Technical Features
- **Authentication & Verification**: Dual registration pathways for Healthcare Facilities and Doctors. Automatic `PENDING_VERIFICATION` status until approved by System Admin.
- **Role-Based Access Control (RBAC)**: Enforced roles (`SYSTEM_ADMIN`, `FACILITY_ADMIN`, `DOCTOR`, `FACILITY_STAFF`, `LAB_STAFF`, `PHARMACY_STAFF`).
- **Many-to-Many Doctor-Facility Associations**: `DoctorFacilityAssociation` model allowing doctors to practice across multiple hospitals and teleconsultation networks.
- **Real-Time Communication (LiveKit)**: Authenticated WebRTC video calling, voice calling, real-time participant presence, and live data packet chat via LiveKit server SDK.

- **Doctor Teleconsultation Disconnect & 10 Post-Session Message Quota**: When a doctor terminates a teleconsultation session, the video call ends. The patient cannot re-enter the video stream without a new appointment, but is granted **up to 10 post-session follow-up text or audio clip messages**.
- **Inter-Hospital Patient Transfers**: Capacity checks for ICU, Emergency, and Oxygen beds with explicit ACCEPT / REJECT approval workflow.
- **Audit Logging**: Comprehensive security audit trail for sensitive patient record access and clinical actions.

---

## Quickstart

```bash
# 1. Install dependencies
cd care_backend
npm install

# 2. Seed development data
npm run seed

# 3. Run automated tests
npm test

# 4. Start backend server
npm run dev
```
Backend runs on `http://localhost:5001`.
