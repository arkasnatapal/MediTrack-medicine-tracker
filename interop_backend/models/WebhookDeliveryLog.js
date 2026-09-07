const mongoose = require('mongoose');

const webhookDeliveryLogSchema = new mongoose.Schema({
  subscriptionId: { type: String, required: true },
  organizationId: { type: String, required: true },
  event: { type: String, required: true },
  eventId: { type: String, required: true },
  targetUrl: { type: String, required: true },
  payload: { type: Object, required: true },
  statusCode: Number,
  success: { type: Boolean, default: false },
  error: String,
  attempt: { type: Number, default: 1 },
  latencyMs: Number
}, { timestamps: true });

module.exports = mongoose.model('InteropWebhookDeliveryLog', webhookDeliveryLogSchema);
