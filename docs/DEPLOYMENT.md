# MediTrack — Docker & Deployment Guide

## 1. Quickstart Development Stack

The entire MediTrack Interoperability Platform ecosystem can be started locally via Docker Compose or node scripts.

### Port Allocation Summary
- `backend`: `http://localhost:5000` (Personal API)
- `care_backend`: `http://localhost:5001` (Care Provider API)
- `interop_backend`: `http://localhost:5002` (Interoperability Platform Gateway & FHIR API)
- `frontend`: `http://localhost:3000` (Personal Web App)
- `care_frontend`: `http://localhost:5173` (Care Provider Dashboard)
- `interop_frontend`: `http://localhost:5174` (Developer Portal & FHIR Explorer)
- `mock_his`: `http://localhost:5175` (Mock Hospital HIS Simulator)
- `meditrack_ai`: `http://localhost:8001` (Python FastAPI AI Engine)

---

## 2. Docker Compose Execution

```bash
# Clone project and build containers
docker-compose up --build -d

# Verify container status
docker-compose ps
```

---

## 3. Health & Readiness Endpoints

- `GET http://localhost:5002/health` — Platform service status
- `GET http://localhost:5002/readiness` — Database & FHIR engine readiness check
