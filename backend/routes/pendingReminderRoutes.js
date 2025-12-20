const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const PendingReminder = require("../models/PendingReminder");
const Medicine = require("../models/Medicine");
const Reminder = require("../models/Reminder");
const FamilyConnection = require("../models/FamilyConnection");
const MedicineLog = require("../models/MedicineLog");

// GET /api/pending-reminders - Get all pending reminders for current user
router.get("/", auth, async (req, res) => {
  try {
    const pendingReminders = await PendingReminder.find({
      user: req.user.id,
      status: "pending",
    })
      .populate("medicine", "name dosage quantity")
      .populate("reminder", "times daysOfWeek")
      .sort({ scheduledTime: -1 })
      .lean();

    res.json({ success: true, pendingReminders });
  } catch (err) {
    console.error("Error fetching pending reminders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch pending reminders" });
  }
});

// POST /api/pending-reminders/:id/confirm - Confirm medicine intake
router.post("/:id/confirm", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const pendingReminder = await PendingReminder.findOne({
      _id: id,
      user: req.user.id,
      status: "pending",
    }).populate("medicine");

    if (!pendingReminder) {
      return res.status(404).json({ success: false, message: "Pending reminder not found" });
    }

    // Update pending reminder status
    pendingReminder.status = "confirmed";
    pendingReminder.confirmedAt = new Date();
    pendingReminder.confirmedAt = new Date();
    await pendingReminder.save();

    // [NEW] LOGGING HOOK
    const actionTime = new Date();
    const scheduledTime = new Date(pendingReminder.scheduledTime);
    const diffMs = actionTime - scheduledTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    let logStatus = "taken_on_time";
    let delayMinutes = null;

    if (diffMins > 60) {
        logStatus = "taken_late";
        delayMinutes = diffMins;
    }

    await MedicineLog.findOneAndUpdate(
        { 
            userId: req.user.id, 
            medicineId: pendingReminder.medicine._id,
            reminderId: pendingReminder.reminder,
            scheduledTime: pendingReminder.scheduledTime
        },
        {
            status: logStatus,
            actionTime: actionTime,
            delayMinutes: delayMinutes
        }
    );

    // Reduce medicine stock by 1
    const medicine = await Medicine.findById(pendingReminder.medicine._id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    medicine.quantity = Math.max(0, medicine.quantity - 1);
    await medicine.save();

    // Notify the creator if it's a different user
    const Reminder = require("../models/Reminder");
    const Notification = require("../models/Notification");
    const reminder = await Reminder.findById(pendingReminder.reminder);
    
    if (reminder && reminder.createdBy.toString() !== req.user.id) {
        // Try to find relationship name
        let actorName = req.user.name;
        try {
            const connection = await FamilyConnection.findOne({
                $or: [
                    { inviter: reminder.createdBy, invitee: req.user.id },
                    { inviter: req.user.id, invitee: reminder.createdBy }
                ],
                status: 'active'
            });

            if (connection) {
                if (connection.inviter.toString() === reminder.createdBy.toString()) {
                    // Creator is inviter, Actor is invitee. Use name set by Inviter for Invitee?
                    // Actually, if I am the Dad (Inviter) and Son (Invitee) takes meds.
                    // I want to see "Son took meds".
                    // The relationship field `relationshipFromInviter` is what Inviter calls Invitee (e.g. "Son").
                    if (connection.relationshipFromInviter) {
                        actorName = connection.relationshipFromInviter;
                    }
                } else {
                    // Creator is invitee, Actor is inviter.
                    // If Son (Invitee) sets reminder for Dad (Inviter).
                    // Dad takes meds. Son sees "Dad took meds".
                    // The relationship field `relationshipFromInvitee` is what Invitee calls Inviter (e.g. "Dad").
                    if (connection.relationshipFromInvitee) {
                        actorName = connection.relationshipFromInvitee;
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching relationship for notification:", e);
        }

        await Notification.create({
            user: reminder.createdBy,
            actor: req.user.id,
            type: "general", // or specific type "reminder_taken"
            title: "Medicine Taken",
            body: `Medicine ${medicine.name} taken by ${actorName}`,
            meta: { reminderId: reminder._id, medicineId: medicine._id, targetUser: req.user.id }
        });
    }

    res.json({
      success: true,
      message: `${medicine.name} taken successfully`,
      stockLeft: medicine.quantity,
      medicine,
    });
  } catch (err) {
    console.error("Error confirming reminder:", err);
    res.status(500).json({ success: false, message: "Failed to confirm reminder" });
  }
});

// POST /api/pending-reminders/:id/dismiss - Dismiss reminder without action
router.post("/:id/dismiss", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const pendingReminder = await PendingReminder.findOneAndUpdate(
      { _id: id, user: req.user.id, status: "pending" },
      { status: "dismissed", dismissedAt: new Date() },
      { new: true }
    );

    if (pendingReminder) {
        // [NEW] LOGGING HOOK
        await MedicineLog.findOneAndUpdate(
            { 
                userId: req.user.id, 
                medicineId: pendingReminder.medicine,
                reminderId: pendingReminder.reminder,
                scheduledTime: pendingReminder.scheduledTime
            },
            {
                status: "skipped",
                actionTime: new Date()
            }
        );
    }

    if (!pendingReminder) {
      return res.status(404).json({ success: false, message: "Pending reminder not found" });
    }

    res.json({ success: true, message: "Reminder dismissed" });
  } catch (err) {
    console.error("Error dismissing reminder:", err);
    res.status(500).json({ success: false, message: "Failed to dismiss reminder" });
  }
});

// POST /api/pending-reminders/medicines/:id/refill - Refill medicine stock
router.post("/medicines/:id/refill", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const medicine = await Medicine.findOne({ _id: id, userId: req.user.id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    medicine.quantity += parseInt(quantity);
    await medicine.save();

    res.json({
      success: true,
      message: `${medicine.name} refilled successfully`,
      medicine,
    });
  } catch (err) {
    console.error("Error refilling medicine:", err);
    res.status(500).json({ success: false, message: "Failed to refill medicine" });
  }
});

// DELETE /api/pending-reminders/medicines/:id/with-reminders - Delete medicine and reminders
router.delete("/medicines/:id/with-reminders", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findOne({ _id: id, userId: req.user.id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }

    // Delete all reminders associated with this medicine
    await Reminder.deleteMany({ medicine: id });

    // Delete all pending reminders for this medicine
    await PendingReminder.deleteMany({ medicine: id });

    // [NEW] LOGGING HOOK
    await MedicineLog.deleteMany({ medicineId: id });

    // Delete the medicine
    await Medicine.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `${medicine.name} and all associated reminders deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting medicine:", err);
    res.status(500).json({ success: false, message: "Failed to delete medicine" });
  }
});

module.exports = router;
