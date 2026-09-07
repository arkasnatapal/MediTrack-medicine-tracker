const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  organizationId: { type: String, required: true },
  status: { type: String, enum: ['draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error'], default: 'active' },
  scope: { type: String, default: 'patient-privacy' },
  category: [{ type: String }],
  policyRule: { type: String, enum: ['permit', 'deny'], default: 'permit' },
  provision: {
    type: { type: String, enum: ['opt-in', 'opt-out'], default: 'opt-in' },
    period: {
      start: Date,
      end: Date
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('InteropConsentRecord', consentRecordSchema);
