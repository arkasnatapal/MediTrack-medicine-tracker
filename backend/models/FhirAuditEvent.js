const mongoose = require('mongoose');

const fhirAuditEventSchema = new mongoose.Schema({
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: String, required: true },
  performedBy: { type: String, default: 'System' },
  userRole: { type: String, default: 'user' },
  outcome: { type: String, default: 'SUCCESS' },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.FhirAuditEvent || mongoose.model('FhirAuditEvent', fhirAuditEventSchema);
