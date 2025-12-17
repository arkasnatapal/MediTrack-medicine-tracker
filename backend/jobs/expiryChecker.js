const Medicine = require("../models/Medicine");
const { createNotification } = require("../utils/notifications");

async function runExpiryCheck() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const expiringMeds = await Medicine.find({
    expiryDate: { $gte: today, $lte: nextWeek },
  }).populate("user");

  const expiredMeds = await Medicine.find({
    expiryDate: { $lt: today },
  }).populate("user");

  for (const med of expiringMeds) {
    if (!med.user?._id) continue;
    // Optional: Check if we already notified recently to avoid spam
    // For now, we follow the simple logic requested
    await createNotification({
      userId: med.user._id,
      type: "medicine_expiring",
      title: "Medicine expiring soon",
      message: `"${med.name}" is expiring soon (${med.expiryDate.toDateString()}).`,
      severity: "warning",
      meta: {
        medicineId: med._id,
        expiryDate: med.expiryDate,
      },
    });
  }

  for (const med of expiredMeds) {
    if (!med.user?._id) continue;
    await createNotification({
      userId: med.user._id,
      type: "medicine_expired",
      title: "Medicine expired",
      message: `"${med.name}" has expired (${med.expiryDate.toDateString()}).`,
      severity: "error",
      meta: {
        medicineId: med._id,
        expiryDate: med.expiryDate,
      },
    });
  }
}

module.exports = { runExpiryCheck };
