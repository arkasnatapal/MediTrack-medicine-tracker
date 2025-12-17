const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendReminderEmail } = require("../utils/reminderEmail");

function getCurrentISTTime() {
  const now = new Date();
  // Convert to UTC first, then add IST offset (UTC + 5:30)
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(utcOffset + istOffset);

  const hours = ist.getHours().toString().padStart(2, "0");
  const minutes = ist.getMinutes().toString().padStart(2, "0");
  const dayIndex = ist.getDay();
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return { ist, hhmm: `${hours}:${minutes}`, today: days[dayIndex] };
}

async function executeReminderCheck() {
  const { ist, hhmm, today } = getCurrentISTTime();
  console.log("⏰ Running reminder check at (IST):", hhmm, today);

  try {
    const reminders = await Reminder.find({
      active: true,
      startDate: { $lte: ist },
      $or: [{ endDate: null }, { endDate: { $gte: ist } }],
      times: hhmm,
      $or: [
        { daysOfWeek: { $size: 0 } },
        { daysOfWeek: today }
      ]
    })
      .populate("targetUser", "name email")
      .populate("createdBy", "name email")
      .populate("watchers", "name email")
      .populate("medicine", "name dosage");

    if (!reminders.length) {
      console.log("✅ No reminders due right now.");
      return;
    }

    console.log(`🚨 ${reminders.length} reminder(s) due — triggering...`);

    for (const rem of reminders) {
      const uniqueRecipients = new Set([
        rem.targetUser?._id?.toString(),
        ...(rem.watchers || []).map(w => w._id.toString())
      ]);

      for (const userId of uniqueRecipients) {
        const user = await User.findById(userId);
        if (!user) continue;

        // CREATE PENDING REMINDER (for tracking and offline support)
        const PendingReminder = require("../models/PendingReminder");
        await PendingReminder.create({
          user: userId,
          reminder: rem._id,
          medicine: rem.medicine._id,
          medicineName: rem.medicineName,
          scheduledTime: ist,
          status: "pending",
        });

        // CREATE IN-APP NOTIFICATION (only if user might be online)
        await Notification.create({
          user: userId,
          type: "medicine_reminder",
          title: `Time to take ${rem.medicineName}`,
          message: `Reminder scheduled at ${hhmm}.`,
          read: false,
          meta: {
            medicineId: rem.medicine?._id,
            targetUserId: rem.targetUser._id,
            createdById: rem.createdBy._id,
          }
        });

        console.log(`🔔 Notification and pending reminder created for ${user.email}`);

        // SEND EMAIL IF ENABLED
        if (rem.channels?.email && user.email) {
          try {
            await sendReminderEmail({
              to: user.email,
              title: `Medicine Reminder — ${rem.medicineName}`,
              message: `It's time to take your medicine at ${hhmm}.`,
              reminder: rem,
            });
            console.log(`📨 Reminder email sent to ${user.email}`);
          } catch (e) {
            console.error("❌ Email sending failed:", e.message);
          }
        }
      }

      await Reminder.findByIdAndUpdate(rem._id, { lastTriggeredAt: ist });
    }
  } catch (err) {
    console.error("❌ Reminder scheduler error:", err);
  }
}

// Check for pending reminders that exceeded grace period (30 mins)
async function checkGracePeriod() {
  try {
    const GRACE_PERIOD_MINS = 30;
    const now = new Date();
    const graceTime = new Date(now.getTime() - GRACE_PERIOD_MINS * 60000);

    // Find pending reminders created before graceTime that are still 'pending'
    // and haven't triggered a 'not_taken' notification yet.
    // We need a way to mark that we've sent the 'not_taken' notification.
    // For now, we can check if we already sent a notification or add a flag to PendingReminder.
    // Let's assume we add a flag `notTakenNotified` to PendingReminder schema or just use a separate check.
    // Since we can't easily modify schema in this step without breaking previous steps or requiring more edits,
    // let's just find them and if we haven't notified, notify. 
    // Wait, if I don't mark it, I will spam notifications.
    // I should add `notTakenNotified` to PendingReminder schema.
    
    // For this iteration, I will assume I can add the field to the schema in a separate tool call if needed, 
    // or I can just use the `updatedAt` field if I update the status to something else? 
    // But the requirement says "if target marks taken before grace ends...". 
    // If I change status, they can't mark it taken? 
    // Maybe I should just add the field.
    
    // Let's add `notTakenNotified` to PendingReminder schema first.
  } catch (err) {
    console.error("Error in grace period check:", err);
  }
}

// Run every minute
function startReminderScheduler() {
  console.log("✅ Reminder Scheduler Started (runs every minute)");
  // Run immediately on startup to catch anything due right now
  executeReminderCheck();
  
  // Also run grace period check
  const { checkGracePeriod } = require('./gracePeriodCheck');
  
  cron.schedule("* * * * *", async () => {
      await executeReminderCheck();
      await checkGracePeriod();
  });
}

module.exports = { startReminderScheduler };
