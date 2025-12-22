# Changes: Cron Migration & Fixes

## Summary
Migrated `node-cron` to HTTP endpoints and implemented robust "lookback window" logic to ensure reminders are never missed even if the trigger is delayed or infrequent.

## Key Fixes (Recent)

### `backend/jobs/reminderScheduler.js`
- **Added Lookback Window**: Scheduler checks for reminders due in the **last 1 minute** (adjustable) to handle slight delays while assuming a per-minute cron schedule.
- **Duplicate Prevention**: Improved logic to check `lastTriggeredAt` against the specific due slot to prevent double-sending notifications.
- **Timezone Robustness**: Explicitly handles UTC to IST conversion for accurate window calculation.
- **Fixed Model Loading**: Added explicit `require` for `Medicine`, `PendingReminder`, and `MedicineLog` models at the top level to prevent serverless cold start crashes.

### `backend/vercel.json`
- **Added Cron Config**: Configured Vercel Cron to automatically call the new endpoints:
    - `/api/cron/run-reminder-check` (Every minute)
    - `/api/cron/check-grace-period` (Every 30 mins)
    - `/api/cron/check-expired-medicines` (Daily at 9 AM)

## Previous Migration Changes

### `backend/package.json`
- **Removed**: `node-cron` dependency.

### `backend/server.js`
- **Removed**: `startCronJobs()` and `startReminderScheduler()` calls.
- **Added**: `/api/cron` route registration.

### `backend/routes/cronRoutes.js`
- **Authentication**: Endpoints protected by `CRON_SECRET`.

## Verification
You can trigger the check at any time. The system assumes an external scheduler (like Vercel Cron) triggers the endpoint every minute.

## Fix: Pending Reminder Time Display

### `frontend/src/components/PendingRemindersWidget.jsx`
- **Fixed Timezone Display**: Updated the time formatting for pending reminders to use `UTC` timezone. The backend stores IST-shifted time as a UTC timestamp (e.g., 11:52 stored as 11:52 UTC). Displaying this in 'Asia/Kolkata' added another 5.5 hours (resulting in 17:22). Using `UTC` renders the intended IST time (11:52).
