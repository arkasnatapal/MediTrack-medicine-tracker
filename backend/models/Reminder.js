const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    // Who this reminder is primarily for (the person who should take the medicine)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who created/set this reminder (could be same as targetUser or a family member)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByType: {
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },
    source: {
      type: String,
      default: "manual", // possible 'ai'
    },

    // The medicine this reminder is for
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },

    // Optional: store plain text name for easier display
    medicineName: {
      type: String,
      default: "",
    },

    // Daily times in "HH:MM" 24-hr format, e.g. ["09:00", "21:00"]
    times: {
      type: [String],
      default: [],
    },

    // Days of the week, e.g. ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    // Can be empty array meaning "every day"
    daysOfWeek: {
      type: [String],
      default: [],
    },

    // When reminders start being active
    startDate: {
      type: Date,
      required: true,
    },

    // When they stop (optional). If null, continue indefinitely.
    endDate: {
      type: Date,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    // Channels: we implement in-app + email now, keep SMS/WhatsApp for future
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },

    // Watchers – additional users who want to be notified when this reminder triggers
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    active: {
      type: Boolean,
      default: true,
    },

    lastTriggeredAt: {
      type: Date,
    },

    googleEventId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);
