# MediTrack – Living Health OS

## What This Is
MediTrack is a continuously running Health Operating System that monitors, learns, and intervenes even when the user is offline.

This is NOT a static website. It is a proactive guardian system.

---

## Core Philosophy
- **Silent monitoring**: Works in the background without user input.
- **Insight-based intervention**: Notifications are only sent if there is value.
- **Progressive behavior**: The system learns patterns over time (e.g. sleep schedules).
- **Rule-based Intelligence**: No black-box ML. Logic is transparent and heuristic-based.

---

## Architecture

### 1. Queues (BullMQ + Redis)
The "Brain" of the system. Logic is decoupled from the web server and runs asynchronously.

| Queue Name | Frequency | Responsibility |
|or|---|---|
| `health-scan-queue` | Daily | Aggregates data to calculate daily Health Score (0-100) & State (Green/Yellow/Red). |
| `medicine-pattern-queue` | Daily | Checks for missed doses, adherence trends, and conflicts. |
| `sleep-intelligence-queue` | Daily | Infers sleep duration/quality from passive user activity logs. |
| `risk-escalation-queue` | ~3 Hours | Monitors persistent "Red" states and decides whether to escalate to family. |
| `improvement-detection-queue` | Weekly | Compares weekly averages to detect positive changes and reinforce them. |

### 2. Triggers (External Scheduler)
The "Clock". The external scheduler hits these endpoints to wake up the Brain.

#### Configuration Table
Configure your external scheduler (e.g., EasyCron, AWS EventBridge) to hit these endpoints using `POST` method.
**Base URL**: `https://your-backend-url.com`

| Endpoint | Schedule (CRON) | Purpose |
|---|---|---|
| `/api/cron/trigger-daily-health` | `0 8 * * *` (8:00 AM) | **Daily Intelligence**: Runs health scan, sleep analysis, and medicine pattern checks. |
| `/api/cron/trigger-risk-check` | `0 */3 * * *` (Every 3 hours) | **Risk Monitor**: Checks for persistent critical health states to trigger escalation. |
| `/api/cron/trigger-weekly-check` | `0 9 * * 1` (Mon 9:00 AM) | **Improvement**: Weekly comparison for positive reinforcement. |
| `/api/cron/run-reminder-check` | `*/30 * * * *` (Every 30 mins) | **Reminders**: Checks for due medicine reminders. |
| `/api/cron/check-grace-period` | `0 * * * *` (Hourly) | **Adherence**: Checks if a medicine is overdue (Grace period). |
| `/api/cron/check-expired-medicines`| `0 0 * * *` (Midnight) | **Inventory**: Flags expired medicines. |

> [!IMPORTANT]
> Secure your endpoints! Pass the header `x-cron-secret: YOUR_SECRET` in your scheduler.


### 3. Intelligence Engines
- **Health Engine**: `src/living-os/intelligence/healthEngine.js`
  - Calculates score based on weighted inputs (Adherence 60%, Sleep 30%, Vitals 10%).
- **Notification Engine**: `src/living-os/intelligence/notificationEngine.js`
  - decided *if* a notification should be sent (cooldowns, importance).
- **Sleep Engine**: `src/living-os/intelligence/sleepIntelligence.js`
  - Infers sleep time by analyzing the gap between user activity on consecutive days.

---

## Health States
- 🟢 **Stable (Green)**: Score > 80. Routine is solid.
- 🟡 **Attention Needed (Yellow)**: Score 50-80. Minor slips in adherence or sleep.
- 🔴 **Risk Detected (Red)**: Score < 50. Immediate attention or family escalation required.

---

## Directory Structure
Code is located in `backend/src/living-os/`:
- `queues/`: BullMQ definitions.
- `workers/`: Logic for processing jobs.
- `intelligence/`: Pure business logic/rules.
- `config/`: Redis setup.

---

## How to Run
1. Ensure Redis is running.
2. `npm install` (installs `bullmq`, `ioredis`).
3. Start the backend: `npm start` or `npm run dev`.
4. Configure your External Scheduler to hit the Trigger endpoints.

---

## Future Roadmap (ML)
Currently, the system uses heuristics. Once sufficient longitudinal data is collected (e.g., 6 months of `UserActivityLog` and `MedicineLog`), we can introduce:
- Anomaly Detection (Isolation Forest) for subtle health degradation.
- Predictive Analytics (LSTM) for adherence forecasting.
