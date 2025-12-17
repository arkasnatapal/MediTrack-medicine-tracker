const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // requester
    action: String, // "ai_create_reminder", "ai_parse"
    details: Object, // parsed intent, response, errors
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditSchema);
