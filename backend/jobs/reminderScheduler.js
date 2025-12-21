// [REMOVED] node-cron dependency for serverless compatibility
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
const User = require("../models/User");
const PendingReminder = require("../models/PendingReminder");
const MedicineLog = require("../models/MedicineLog");
// Ensure Medicine model is registered for population
require("../models/Medicine");
const { sendReminderEmail } = require("../utils/reminderEmail");

function getCurrentISTTime() {
  const now = new Date();
  // Convert to UTC first, then add IST offset (UTC + 5:30)
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  // Return actual IST Date object
  return new Date(utcOffset + istOffset);
}

function getWindowTimes(istDate, lookbackMinutes = 1) {
  const times = [];
  const current = new Date(istDate.getTime());
  
  // Checking times from [now - lookback] up to [now]
  // We go minute by minute
  for (let i = 0; i <= lookbackMinutes; i++) {
    const d = new Date(current.getTime() - (i * 60000));
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    times.push(`${hh}:${mm}`);
  }
  return [...new Set(times)]; // Unique times
}

async function executeReminderCheck() {
  const ist = getCurrentISTTime();
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const todayDay = days[ist.getDay()];
  
  // Lookback window to catch skipped minutes (e.g. if cron runs every 10 mins)
  const checkTimes = getWindowTimes(ist, 15);
  const currentTimeStr = ist.getHours().toString().padStart(2,'0') + ":" + ist.getMinutes().toString().padStart(2,'0');

  console.log(`⏰ Running reminder check at (IST): ${currentTimeStr}, Window: [${checkTimes[checkTimes.length-1]} - ${checkTimes[0]}]`);

  try {
    // Find reminders that match ANY of the times in our window
    const reminders = await Reminder.find({
      active: true,
      startDate: { $lte: ist },
      $or: [{ endDate: null }, { endDate: { $gte: ist } }],
      times: { $in: checkTimes }, // Matches any time in the window
      $or: [
        { daysOfWeek: { $size: 0 } },
        { daysOfWeek: todayDay }
      ]
    })
      .populate("targetUser", "name email")
      .populate("createdBy", "name email")
      .populate("watchers", "name email")
      .populate("medicine", "name dosage");

    if (!reminders.length) {
      console.log("✅ No matching reminders in this window.");
      return;
    }

    console.log(`🔍 Found ${reminders.length} potential reminder(s)... checking if already triggered.`);

    let triggeredCount = 0;

    for (const rem of reminders) {
      // Check each scheduled time in the window for this reminder
      // A reminder might have multiple times, e.g. ["09:00", "14:00"]
      // We only care about the ones strictly in our checkTimes window
      const dueTimes = rem.times.filter(t => checkTimes.includes(t));

      for (const dueTime of dueTimes) {
         // Construct the specific Due Date for this time slot (Today at HH:MM)
         const [h, m] = dueTime.split(':').map(Number);
         const dueDate = new Date(ist);
         dueDate.setHours(h, m, 0, 0);

         // CRITICAL: Check if already triggered for this specific slot or later
         // If lastTriggeredAt is AFTER the due date (with 1 min tolerance), skip
         // Tolerance allows slight overlaps without double firing, though equality check is usually enough
         // If lastTriggeredAt >= dueDate, it means we handled this slot (or a later one).
         if (rem.lastTriggeredAt && rem.lastTriggeredAt >= dueDate) {
            // converting dates to timestamps for safer comparison logic if needed, 
            // but JS date comparison works fine.
            // console.log(`Skipping ${rem.medicineName} at ${dueTime} - already triggered at ${rem.lastTriggeredAt}`);
            continue;
         }

         // If we are here, it's due and hasn't been triggered
         console.log(`🚀 Triggering ${rem.medicineName} for ${dueTime} (Due: ${dueDate.toLocaleTimeString()})`);
         
         await triggerSingleReminder(rem, ist, dueTime);
         
         // Update lastTriggeredAt to NOW (so we don't re-trigger this slot)
         // Note: If multiple slots match in one run (rare/backlog), this updates for the latest one processed.
         await Reminder.findByIdAndUpdate(rem._id, { lastTriggeredAt: ist });
         triggeredCount++;
      }
    }
    
    if (triggeredCount === 0) {
        console.log("✅ All due reminders were already triggered.");
    }

  } catch (err) {
    console.error("❌ Reminder scheduler error:", err);
  }
}

async function triggerSingleReminder(rem, ist, dueTime) {
    const uniqueRecipients = new Set([
        rem.targetUser?._id?.toString(),
        ...(rem.watchers || []).map(w => w._id.toString())
      ]);

      for (const userId of uniqueRecipients) {
        const user = await User.findById(userId);
        if (!user) continue;

        // CREATE PENDING REMINDER
        // Check if pending reminder already exists for today/this time to be extra safe?
        // Relying on lastTriggeredAt is mostly sufficient, but redundancy helps.
        // Skipping redundant check for performance unless requested.

        await PendingReminder.create({
          user: userId,
          reminder: rem._id,
          medicine: rem.medicine._id,
          medicineName: rem.medicineName,
          scheduledTime: ist,
          status: "pending",
        });

        // LOGGING HOOK
        await MedicineLog.create({
          userId: userId,
          medicineId: rem.medicine._id,
          reminderId: rem._id,
          scheduledTime: ist,
          status: "pending",
        });

        // NOTIFICATION
        await Notification.create({
          user: userId,
          type: "medicine_reminder",
          title: `Time to take ${rem.medicineName}`,
          message: `Reminder scheduled at ${dueTime}.`,
          read: false,
          meta: {
            medicineId: rem.medicine?._id,
            targetUserId: rem.targetUser._id,
            createdById: rem.createdBy._id,
          }
        });

        console.log(`🔔 Sent to ${user.email} for ${dueTime}`);

        // EMAIL
        if (rem.channels?.email && user.email) {
          try {
            await sendReminderEmail({
              to: user.email,
              title: `Medicine Reminder — ${rem.medicineName}`,
              message: `It's time to take your medicine at ${dueTime}.`,
              reminder: rem,
            });
          } catch (e) {
            console.error("❌ Email failed:", e.message);
          }
        }
      }
}

// [REMOVED] internal logic of startReminderScheduler. 
// Function logic is now exposed via executeReminderCheck to be triggered via HTTP.

module.exports = { executeReminderCheck };
