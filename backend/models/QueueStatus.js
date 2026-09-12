const mongoose = require('mongoose');

const queueStatusSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  currentToken: {
    type: Number,
    default: 1
  },
  lastAssignedToken: {
    type: Number,
    default: 1
  },
  estimatedWaitPerPatientMinutes: {
    type: Number,
    default: 7
  },
  averageConsultationMinutes: {
    type: Number,
    default: 7
  },
  departmentAverages: {
    type: Map,
    of: Number,
    default: {
      'General OPD': 7,
      'Cardiology OPD': 12,
      'Pediatrics OPD': 8,
      'Orthopedics OPD': 10,
      'Neurology OPD': 10,
      'Dermatology OPD': 8,
      'ENT OPD': 7
    }
  },
  currentPatientRemainingMinutes: {
    type: Number,
    default: 7
  },
  currentPatientStartedAt: {
    type: Date,
    default: null
  },
  activeDoctorsCount: {
    type: Number,
    default: 1
  },
  useRollingAverage: {
    type: Boolean,
    default: false
  },
  recentConsultations: [{
    durationMinutes: Number,
    completedAt: { type: Date, default: Date.now },
    doctorId: String
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'CLOSED'],
    default: 'ACTIVE'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('QueueStatus', queueStatusSchema);

