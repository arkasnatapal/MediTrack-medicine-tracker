const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // who triggered it
    },
    type: {
      type: String,
      enum: [
        "medicine_created",
        "medicine_deleted",
        "medicine_expiring",
        "medicine_expired",
        "medicine_reminder",
        "system_error",
        "family_invitation",
        "general",
      ],
      default: "general",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
    },
    meta: {
      type: Object, // can store medicineId, expiryDate, etc.
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
