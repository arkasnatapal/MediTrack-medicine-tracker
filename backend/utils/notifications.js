const Notification = require("../models/Notification");

async function createNotification({
  userId,
  type = "general",
  title,
  message = "",
  severity = "info",
  meta = {},
}) {
  if (!userId) return null;

  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      severity,
      meta,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

module.exports = {
  createNotification,
};
