# MediTrack Care Network Vercel Deployment Guide

This guide explains how to deploy `care_backend` and `care_frontend` to Vercel so they can operate alongside your already published services (`meditrack-backendalpha.vercel.app` and `meditrack-ultimate.vercel.app`).

---

## 1. Deploying `care_backend` (Backend API Service)

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.app) and click **Add New Project**.
2. Select your GitHub repository: `arkasnatapal/MediTrack-medicine-tracker`.
3. In **Project Name**, enter e.g. `meditrack-care-backend`.
4. **Root Directory**: Select `care_backend` (**CRITICAL**).
5. **Framework Preset**: Select `Other` or `Node.js`.
6. Expand **Environment Variables** and set:
   - `MONGODB_URI`: `mongodb+srv://arka4551_db_user:zAWNdtQ5cHapl0p0@cluster0.a55xu4a.mongodb.net/?appName=Cluster0`
   - `JWT_SECRET`: `meditrack_care_network_super_secret_key_2026`
   - `PORT`: `5001`
7. Click **Deploy**.

Vercel will output a URL, e.g.: `https://meditrack-care-backend.vercel.app`.

### Option B: Via Vercel CLI

```bash
cd care_backend
vercel --prod
```

---

## 2. Deploying `care_frontend` (Hospital & Provider Portal)

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.app) and click **Add New Project**.
2. Select your GitHub repository: `arkasnatapal/MediTrack-medicine-tracker`.
3. In **Project Name**, enter e.g. `meditrack-care-frontend`.
4. **Root Directory**: Select `care_frontend` (**CRITICAL**).
5. **Framework Preset**: Select `Vite`.
6. Expand **Environment Variables** and set:
   - `VITE_CARE_API_BASE_URL`: `https://meditrack-care-backend.vercel.app/api` (Use your deployed `care_backend` URL)
   - `VITE_FHIR_API_BASE_URL`: `https://meditrack-care-backend.vercel.app/fhir`
   - `VITE_API_BASE_URL`: `https://meditrack-backendalpha.vercel.app/api`
7. Click **Deploy**.

Vercel will output a URL, e.g.: `https://meditrack-care-frontend.vercel.app`.

### Option B: Via Vercel CLI

```bash
cd care_frontend
vercel --prod
```

---

## 3. Environment Variables Summary Table

| Service | Key | Recommended Production Value |
|---|---|---|
| `care_backend` | `MONGODB_URI` | `mongodb+srv://...` |
| `care_backend` | `JWT_SECRET` | `meditrack_care_network_super_secret_key_2026` |
| `care_frontend` | `VITE_CARE_API_BASE_URL` | `https://<YOUR_CARE_BACKEND_VERCEL_URL>/api` |
| `care_frontend` | `VITE_FHIR_API_BASE_URL` | `https://<YOUR_CARE_BACKEND_VERCEL_URL>/fhir` |
| `care_frontend` | `VITE_API_BASE_URL` | `https://meditrack-backendalpha.vercel.app/api` |
| `frontend` | `VITE_CARE_BACKEND_URL` | `https://<YOUR_CARE_BACKEND_VERCEL_URL>` |
