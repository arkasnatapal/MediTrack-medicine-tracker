# MediTrack Care Network - Provider Frontend (`/care_frontend`)

## Overview
`/care_frontend` is the React (Vite) and Tailwind CSS provider application for the **MediTrack Care Network**. It delivers responsive, operational dashboards for Healthcare Facilities, Doctors, System Administrators, and an interactive Patient Integration Simulator.

---

## Portals & Routing
- `/` - **MediTrack Care Network Landing Gateway** (Choose Facility, Doctor, or System Admin portal).
- `/facility/auth` - Facility Registration (all required fields + `PENDING_VERIFICATION` alert) & Login.
- `/doctor/auth` - Doctor Registration (Medical Reg ID, Specialization + `PENDING_VERIFICATION` alert) & Login.
- `/admin/login` - System Administrator Login.
- `/facility/dashboard` - Facility Operational Dashboard (Appointments, Queue, Referrals, Emergency Transfers with ICU/Bed Capacity Monitor, Medicine Inventory, Doctors & Staff).
- `/doctor/dashboard` - Clinical Doctor Console (Queue Controller, Prescriptions, **Teleconsultation Room with End Session button & Patient 10-message tracker**, Referrals, Associated Facilities).
- `/admin/dashboard` - System Admin Verification & Security Audit Trail.
- `/patient-simulator` - Interactive Patient Simulator (Live Queue Token lookup, Teleconsultation Post-Session 10-Message Chat, Visual Care Journey Timeline).

---

## Quickstart

```bash
# 1. Install dependencies
cd care_frontend
npm install

# 2. Run Vite dev server
npm run dev
```
Frontend runs on `http://localhost:5174`.
