const mongoose = require('mongoose');

const clinicalResourceSchema = new mongoose.Schema({
  organizationId: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  fhirId: { type: String, required: true, index: true },
  patientId: { type: String, index: true }, // Optional patient reference for quick search
  status: { type: String, index: true },
  resource: { type: Object, required: true }, // Complete HL7 FHIR R4 JSON object
  meta: {
    versionId: { type: String, default: '1' },
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true });

clinicalResourceSchema.index({ organizationId: 1, resourceType: 1, fhirId: 1 }, { unique: true });
clinicalResourceSchema.index({ organizationId: 1, resourceType: 1, patientId: 1 });

module.exports = mongoose.model('InteropClinicalResource', clinicalResourceSchema);
