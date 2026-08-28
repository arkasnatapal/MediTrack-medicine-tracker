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
    default: 5
  },
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
