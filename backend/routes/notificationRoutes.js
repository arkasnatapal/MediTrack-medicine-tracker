const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const filter = { user: req.user.id };
    if (unreadOnly) filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Error loading notifications:", error);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
});

// POST /api/notifications/read
router.post("/read", protect, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Notification ID required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ success: false, message: "Failed to update notification" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
});

module.exports = router;
