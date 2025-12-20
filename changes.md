# Changes - Medicine Reminder Logging System

## Backend
- **New Collection**: `medicine_logs`
  - Tracks status: `pending`, `taken_on_time`, `taken_late`, `skipped`.
  - Stores `scheduledTime`, `actionTime`, `delayMinutes`.
- **New Model**: `backend/models/MedicineLog.js`
- **Hooks Added**:
  - `backend/jobs/reminderScheduler.js`: Creates "pending" log when reminder is triggered.
  - `backend/routes/pendingReminderRoutes.js`:
    - `confirm`: Updates log to "taken_on_time" or "taken_late".
    - `dismiss`: Updates log to "skipped".
    - `delete`: Deletes associated logs.
  - `backend/routes/reminderRoutes.js`: Deletes logs when reminder is deleted.
  - `backend/controllers/medicineController.js`: Deletes logs when medicine is deleted.
- **New API**: `GET /api/medicine-logs` in `backend/routes/medicineLogRoutes.js`.

## Frontend
- **New Page**: `MedicationStatus.jsx` at `/medication-status`.
- **Route Added**: `/medication-status` in `App.jsx`.
- **Features**:
  - Displays list of medicine logs.
  - Shows status badges (Pending, Taken on Time, Taken Late, Skipped).
  - Shows delay in minutes for late intake.
  - Responsive table layout.

## Logic
- **On Time vs Late**: If action is within 60 minutes of scheduled time, it is "taken_on_time". Otherwise "taken_late".
- **Skipped**: If user dismisses the reminder.
- **Pending**: If no action is taken.
- **Cascade Delete**: Logs are deleted if the medicine or reminder is deleted.

## Constraints Check
- Existing reminder logic NOT modified.
- Existing scheduling code NOT modified (only hooked into).
- No AI usage.
- No background inference.
- No UI behavior changes to existing reminder flow.
