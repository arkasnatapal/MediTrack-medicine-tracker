# Changes Log

## [Feature] Post-Signup Onboarding Flow
**Date**: 2026-01-02
**Status**: Implemented

### Description
Implemented a unified onboarding sequence that runs on the Dashboard to collect missing profile information. This replaces disjointed logic and adds the new Family Medical History step.

### Key Changes
- **New Components**:
    - `MedicalHistoryModal.jsx`: Modal for collecting family history.
    - `CompleteProfileManager.jsx`: Orchestrator that checks user profile completeness and triggers modals sequentially.
- **Dashboard Integration**:
    - Added `CompleteProfileManager` to `Dashboard.jsx`.
- **Modifications**:
    - **Signup.jsx**: Reverted to single-step flow (medical history removed from form).
    - **GoogleAuthSuccess.jsx**: Removed inline modal logic; now delegates to Dashboard's manager.

### Flow
1.  **Gender** (if missing).
2.  **Emergency Contact** (if missing).
3.  **Family Medical History** (if missing).

## [Feature] Family / Genetic Medical History
**Date**: 2026-01-02
**Status**: Implemented

### Description
Added an optional feature for users to store family medical history. This data is used solely as background context for Health Intelligence and Future Predictions.

### Key Changes
- **Backend Schema**: Added `familyMedicalHistory` (Array[String]) to `User` model.
- **Backend API**: Updated `/auth/register` and `/auth/me` (via settings update) to handle this field.
- **Frontend UI**: 
    - Converted `Signup` to a 2-step process (**REVERTED**).
    - Added "Medical History" section to `Settings` page.
- **AI Integration**: Passed history to `intelligenceController` as non-diagnostic context.

### Safety & Privacy
- **Optional**: User can skip or leave empty.
- **Passive**: Updating this field does NOT trigger AI re-analysis.
- **Advisory**: AI prompts explicitly restrict this data to "background risk context" to prevent false diagnoses.

# Health Intelligence System Upgrade
... (Previous entries)
