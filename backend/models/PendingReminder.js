const mongoose = require("mongoose");

const pendingReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "dismissed"],
      default: "pending",
      index: true,
    },
    confirmedAt: {
      type: Date,
    },
    dismissedAt: {
      type: Date,
    },
    notTakenNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying of pending reminders
pendingReminderSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("PendingReminder", pendingReminderSchema);
