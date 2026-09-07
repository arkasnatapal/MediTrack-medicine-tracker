const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. "REST-API", "FHIR-READ", "FHIR-CREATE"
  action: { type: String, enum: ['C', 'R', 'U', 'D', 'E'], default: 'R' },
  actor: {
    id: String,
    name: String,
    role: String,
    orgId: String
  },
  resourceType: String,
  resourceId: String,
  requestPath: String,
  method: String,
  statusCode: Number,
  outcome: { type: String, enum: ['0', '4', '8', '12'], default: '0' }, // 0=Success, 4=Minor fail, 8=Serious, 12=Major
  details: String,
  ipAddress: String
}, { timestamps: true });

module.exports = mongoose.model('InteropAuditEvent', auditEventSchema);
