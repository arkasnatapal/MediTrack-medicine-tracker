const mongoose = require('mongoose');

const diagnosticServiceSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true
  },
  facilityName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true // e.g. ECG, X-Ray, CT, MRI, Ultrasound, Pathology
  },
  available: {
    type: Boolean,
    default: true
  },
  estimatedWaitingTimeMinutes: {
    type: Number,
    default: 15
  },
  operatingHours: {
    type: String,
    default: '24/7'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DiagnosticService', diagnosticServiceSchema);
