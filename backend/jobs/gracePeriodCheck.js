const PendingReminder = require("../models/PendingReminder");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");

async function checkGracePeriod() {
  try {
    const GRACE_PERIOD_MINS = 30;
    const now = new Date();
    // We want reminders scheduled MORE than 30 mins ago
    const cutoffTime = new Date(now.getTime() - GRACE_PERIOD_MINS * 60000);

    const overdueReminders = await PendingReminder.find({
      status: "pending",
      scheduledTime: { $lte: cutoffTime },
      notTakenNotified: false,
    }).populate("reminder medicine");

    for (const pr of overdueReminders) {
      // Mark as notified so we don't spam
      pr.notTakenNotified = true;
      await pr.save();

      if (!pr.reminder) continue;

      const reminder = await Reminder.findById(pr.reminder._id).populate("createdBy targetUser");
      if (!reminder) continue;

      // Notify creator if they are different from target
      if (reminder.createdBy._id.toString() !== reminder.targetUser._id.toString()) {
        await Notification.create({
          user: reminder.createdBy._id,
          actor: reminder.targetUser._id, // or system
          type: "general", // or "reminder_missed"
          title: "Medicine Not Taken",
          body: `${reminder.targetUser.name} did NOT take ${pr.medicineName} (scheduled at ${new Date(pr.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
          meta: { reminderId: reminder._id, medicineId: pr.medicine._id, targetUser: reminder.targetUser._id }
        });
        console.log(`⚠️ Sent 'not taken' notification to ${reminder.createdBy.email}`);
      }
    }
  } catch (err) {
    console.error("❌ Grace period check error:", err);
  }
}

module.exports = { checkGracePeriod };
