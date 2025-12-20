const mongoose = require("mongoose");

const medicineLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true,
    },
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      required: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    actionTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "taken_on_time", "taken_late", "skipped"],
      default: "pending",
    },
    delayMinutes: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically, but we have explicit createdAt in schema requirement. Mongoose handles it.
);

module.exports = mongoose.model("MedicineLog", medicineLogSchema);
