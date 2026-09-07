const mongoose = require('mongoose');

const webhookSubscriptionSchema = new mongoose.Schema({
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  secret: { type: String, required: true }, // HMAC secret
  events: [{ type: String }], // e.g. ["patient.created", "observation.created", "triage.completed"]
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InteropWebhookSubscription', webhookSubscriptionSchema);
