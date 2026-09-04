const mongoose = require('mongoose');

const abdmConsentRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterType: {
    type: String,
    enum: ['HOSPITAL', 'CLINIC', 'DIAGNOSTIC_LAB', 'DOCTOR'],
    default: 'HOSPITAL'
  },
  requesterFacilityId: {
    type: String,
    default: 'FAC-IN-DL-AIIMS-01'
  },
  purpose: {
    type: String,
    required: true,
    default: 'Care Consultation & Emergency Review'
  },
  healthRecordTypes: [{
    type: String,
    enum: ['PRESCRIPTIONS', 'DIAGNOSTIC_REPORTS', 'DISCHARGE_SUMMARY', 'HEALTH_SUMMARY', 'MEDICATION_HISTORY']
  }],
  status: {
    type: String,
    enum: ['PENDING', 'GRANTED', 'DENIED', 'EXPIRED'],
    default: 'PENDING'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  validTill: {
    type: Date,
    required: true
  },
  respondedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('AbdmConsentRequest', abdmConsentRequestSchema);
