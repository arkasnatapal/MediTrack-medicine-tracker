# Add Medicine Changes

## Overview
Implemented a button-based AI medicine lookup system in the "Add Medicine" page. This allows users to search for medicine details using AI if they are not found locally.

## New Collection: `medicine_catalog`
A new MongoDB collection `medicine_catalog` has been created to store medicine details.
- **Fields**: `brandName`, `genericName`, `category`, `dosageInfo`, `commonUses`, `precautions`, `imageUrl`, `createdBy`, `verified`, `createdAt`.
- **Purpose**: Caches AI-generated results and stores manually added medicines for future quick lookups.

## Cloudinary Integration
- **Utility**: `backend/utils/cloudinaryHelper.js`
- **Function**: `uploadToCloudinary(imageSource)`
- **Usage**: Uploads AI-provided images (or placeholders) to Cloudinary and stores the secure URL in MongoDB.
- **Environment Variables**: Uses existing `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## New Endpoints
Mounted at `/api/medicine-catalog`:

### 1. Local Lookup
- **Endpoint**: `POST /api/medicine-catalog/lookup`
- **Input**: `{ "query": "Medicine Name" }`
- **Behavior**: Searches `medicine_catalog` case-insensitively. Returns `{ found: true, data: ... }` or `{ found: false }`.
- **AI Usage**: None.

### 2. AI Search
- **Endpoint**: `POST /api/medicine-catalog/ai-search`
- **Input**: `{ "query": "Medicine Name" }`
- **Behavior**: 
    1. Calls Google Gemini AI to generate medicine details.
    2. Uploads image to Cloudinary.
    3. Saves result to `medicine_catalog` with `createdBy: "ai"`.
    4. Returns details.
- **AI Usage**: Triggered ONLY when this endpoint is called (explicit user action).

## AI Quota Protection
- AI is **NEVER** triggered automatically on typing.
- AI is **ONLY** triggered when the user clicks the "AI Search" button AND the local lookup fails (or user explicitly requests it via the UI flow).
- Results are **CACHED** in MongoDB, so subsequent searches for the same medicine will use the local database, saving AI quota.

## Safety & UX
- **Confirmation**: Users must explicitly click "Use This Data" to populate the form.
- **Warning**: A note "AI-assisted data. Please consult a doctor." is displayed.
- **No Overwrite**: Existing backend logic for medicine user collections and OCR is untouched.
