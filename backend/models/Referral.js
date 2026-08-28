const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referralId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  fromFacilityId: {
    type: String,
    required: true
  },
  fromFacilityName: {
    type: String,
    required: true
  },
  toFacilityId: {
    type: String,
    required: true
  },
  toFacilityName: {
    type: String,
    required: true
  },
  referredByDoctor: {
    type: String,
    default: 'Dr. Primary Healthcare Officer'
  },
  reason: {
    type: String,
    required: true
  },
  specialtyRequired: {
    type: String,
    default: 'Cardiology'
  },
  priority: {
    type: String,
    enum: ['ROUTINE', 'URGENT', 'CRITICAL_EMERGENCY'],
    default: 'URGENT'
  },
  status: {
    type: String,
    enum: ['CREATED', 'ACCEPTED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED', 'CANCELLED'],
    default: 'CREATED'
  },
  clinicalNotes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);
