const mongoose = require("mongoose");

const familyConnectionSchema = new mongoose.Schema(
  {
    // The user who sent the invite
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user who is being invited (may be null until they create an account)
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    relationshipFromInviter: {
      type: String,
      required: true, // Now required
      trim: true,
    },
    relationshipFromInvitee: {
      type: String,
      default: "", // invitee can later set e.g. "Son", "Daughter"
    },
    allowAiActions: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["invited", "pending_acceptance", "active", "declined", "removed"],
      default: "invited",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyConnection", familyConnectionSchema);
