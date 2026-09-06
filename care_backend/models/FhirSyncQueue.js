const mongoose = require('mongoose');

const fhirSyncQueueSchema = new mongoose.Schema({
  resourceType: { type: String, required: true },
  resourceId: { type: String, required: true },
  action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], default: 'CREATE' },
  payload: { type: Object, required: true },
  status: { type: String, enum: ['QUEUED', 'SYNCED', 'FAILED'], default: 'QUEUED' },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  lastError: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.FhirSyncQueue || mongoose.model('FhirSyncQueue', fhirSyncQueueSchema);
