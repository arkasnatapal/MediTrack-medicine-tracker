# MediTrack Care Network - Setup & Launch Guide

Follow these simple steps to spin up the entire MediTrack Care Network ecosystem alongside the existing MediTrack patient app.

---

## 1. Backend Setup (`/care_backend`)

```bash
cd care_backend`

# Install dependencies
npm install

# Seed sample healthcare facilities, doctors, appointments & stock
npm run seed

# Run test suite
npm test

# Start care backend server (Port 5001)
npm run dev
```

---

## 2. Frontend Setup (`/care_frontend`)

```bash
cd care_frontend

# Install dependencies
npm install

# Start Vite dev server (Port 5174)
npm run dev
```

---

## 3. Demo Credentials

### System Admin
- **URL**: `http://localhost:5174/admin/login`
- **Email**: `admin@meditrack.care`
- **Password**: `admin123`

### PHC Facility Admin
- **URL**: `http://localhost:5174/facility/auth?mode=login`
- **Email**: `phcadmin@meditrack.care`
- **Password**: `facility123`

### District Hospital Admin
- **URL**: `http://localhost:5174/facility/auth?mode=login`
- **Email**: `hospitaladmin@meditrack.care`
- **Password**: `facility123`

### Doctor (Cardiology Specialist)
- **URL**: `http://localhost:5174/doctor/auth?mode=login`
- **Email**: `doctor.rajesh@meditrack.care`
- **Password**: `doctor123`

### Patient Simulator (Integration Test)
- **URL**: `http://localhost:5174/patient-simulator`
- **Phone**: `9876543210`
