const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    familyConnection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyConnection",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-delete messages after 24 hours (86400 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Message", messageSchema);
