const mongoose = require('mongoose');

const fhirProvenanceSchema = new mongoose.Schema({
  targetResourceType: { type: String, required: true },
  targetResourceId: { type: String, required: true },
  provenanceType: { type: String, enum: ['AI_GENERATED', 'HUMAN_CONFIRMED', 'IMPORTED_EXTERNAL'], default: 'HUMAN_CONFIRMED' },
  agentName: { type: String, default: 'MediTrack Living Health OS' },
  recordedTime: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.FhirProvenance || mongoose.model('FhirProvenance', fhirProvenanceSchema);
