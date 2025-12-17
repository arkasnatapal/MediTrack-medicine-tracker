const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Reminder = require("../models/Reminder");
const Medicine = require("../models/Medicine");

const Notification = require("../models/Notification");
const { sendReminderEmail } = require("../utils/reminderEmail");
const {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("../utils/googleCalendar");

router.post("/test", auth, async (req, res) => {
  await Notification.create({
    user: req.user.id,
    type: "medicine_reminder",
    title: "Test Reminder",
    message: "This is a manual test reminder",
    read: false,
  });

  await sendReminderEmail({
    to: req.user.email,
    title: "Test Reminder Email",
    message: "This is a test email sent successfully.",
  });

  res.json({ success: true, message: "Test reminder triggered" });
});

// GET /api/reminders/by-medicine/:medicineId - get reminders for a specific medicine
router.get("/by-medicine/:medicineId", auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      medicine: req.params.medicineId,
      active: true,
    }).lean();

    res.json({ success: true, reminders });
  } catch (err) {
    console.error("Error fetching reminders for medicine:", err);
    res.status(500).json({ success: false, message: "Failed to load reminders" });
  }
});

// GET /api/reminders - reminders related to the current user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const reminders = await Reminder.find({
      $or: [
        { targetUser: userId },
        { watchers: userId },
      ],
      active: true,
    })
      .populate("medicine", "name dosage")
      .populate("targetUser", "name email")
      .populate("createdBy", "name email")
      .lean();

    res.json({ success: true, reminders });
  } catch (err) {
    console.error("Error loading reminders:", err);
    res.status(500).json({ success: false, message: "Failed to load reminders" });
  }
});

// POST /api/reminders
router.post("/", auth, async (req, res) => {
  try {
    const {
      medicineId,
      targetUserId,
      times,
      daysOfWeek,
      startDate,
      endDate,
      channels,
      watchers,
    } = req.body;

    if (!medicineId || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({
        success: false,
        message: "medicineId and at least one time are required",
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    const finalTargetUserId = targetUserId || req.user.id;

    const reminder = await Reminder.create({
      medicine: medicine._id,
      medicineName: medicine.name,
      targetUser: finalTargetUserId,
      createdBy: req.user.id,
      times,
      daysOfWeek: daysOfWeek || [],
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      channels: {
        inApp: channels?.inApp ?? true,
        email: channels?.email ?? true,
        whatsapp: channels?.whatsapp ?? false,
        sms: channels?.sms ?? false,
      },
      watchers: watchers || [],
    });

    // Google Calendar Sync (Best Effort)
    try {
      const event = await createCalendarEvent(req.user.id, reminder);
      if (event && event.id) {
        reminder.googleEventId = event.id;
        await reminder.save();
      }
    } catch (calErr) {
      console.error("Google Calendar Sync Error (Create):", calErr.message);
    }

    res.status(201).json({ success: true, reminder });
  } catch (err) {
    console.error("Error creating reminder:", err);
    res.status(500).json({ success: false, message: "Failed to create reminder" });
  }
});

// PUT /api/reminders/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      times,
      daysOfWeek,
      startDate,
      endDate,
      channels,
      active
    } = req.body;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    // Check permissions
    if (reminder.createdBy.toString() !== req.user.id && reminder.targetUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this reminder" });
    }

    // Update fields
    if (times) reminder.times = times;
    if (daysOfWeek) reminder.daysOfWeek = daysOfWeek;
    if (startDate) reminder.startDate = new Date(startDate);
    if (endDate !== undefined) reminder.endDate = endDate ? new Date(endDate) : null;
    if (active !== undefined) reminder.active = active;
    
    if (channels) {
      reminder.channels = {
        ...reminder.channels,
        ...channels
      };
    }

    await reminder.save();

    // Google Calendar Sync (Best Effort)
    try {
      if (reminder.googleEventId) {
        await updateCalendarEvent(req.user.id, reminder.googleEventId, reminder);
      } else {
        // If no event exists yet (maybe user just connected calendar), try creating one
        const event = await createCalendarEvent(req.user.id, reminder);
        if (event && event.id) {
          reminder.googleEventId = event.id;
          await reminder.save();
        }
      }
    } catch (calErr) {
      console.error("Google Calendar Sync Error (Update):", calErr.message);
    }

    res.json({ success: true, reminder });
  } catch (err) {
    console.error("Error updating reminder:", err);
    res.status(500).json({ success: false, message: "Failed to update reminder" });
  }
});

// DELETE /api/reminders/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found" });
    }

    // Check if user has permission to delete (creator, target, or watcher)
    console.log(`[DELETE Reminder] User: ${userId}, Creator: ${reminder.createdBy}, Target: ${reminder.targetUser}`);
    console.log(`[DELETE Reminder] Watchers:`, reminder.watchers);

    const canDelete = 
      (reminder.createdBy && reminder.createdBy.toString() === userId) ||
      (reminder.targetUser && reminder.targetUser.toString() === userId) ||
      (reminder.watchers && reminder.watchers.some(w => w.toString() === userId));

    console.log(`[DELETE Reminder] Can Delete: ${canDelete}`);

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to delete this reminder. You must be the creator, target user, or a watcher." 
      });
    }

    // Google Calendar Sync (Best Effort)
    try {
      if (reminder.googleEventId) {
        await deleteCalendarEvent(userId, reminder.googleEventId);
      }
    } catch (calErr) {
      console.error("Google Calendar Sync Error (Delete):", calErr.message);
    }

    await Reminder.findByIdAndDelete(id);
    res.json({ success: true, message: "Reminder deleted successfully" });
  } catch (err) {
    console.error("Error deleting reminder:", err);
    res.status(500).json({ success: false, message: "Failed to delete reminder" });
  }
});

module.exports = router;
