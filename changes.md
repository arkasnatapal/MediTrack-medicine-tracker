# Changes: Cron Migration & Fixes

## Summary
Migrated `node-cron` to HTTP endpoints and implemented robust "lookback window" logic to ensure reminders are never missed even if the trigger is delayed or infrequent.

## Key Fixes (Recent)

### `backend/jobs/reminderScheduler.js`
- **Added Lookback Window**: Scheduler checks for reminders due in the **last 1 minute** (adjustable) to handle slight delays while assuming a per-minute cron schedule.
- **Duplicate Prevention**: Improved logic to check `lastTriggeredAt` against the specific due slot to prevent double-sending notifications.
- **Timezone Robustness**: Explicitly handles UTC to IST conversion for accurate window calculation.
- **Fixed Model Loading**: Added explicit `require` for `Medicine`, `PendingReminder`, and `MedicineLog` models at the top level to prevent serverless cold start crashes.

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
