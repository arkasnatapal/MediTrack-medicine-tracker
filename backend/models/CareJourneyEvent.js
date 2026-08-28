const mongoose = require('mongoose');

const careJourneyEventSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['TRIAGE', 'EMERGENCY', 'FIND_CARE', 'APPOINTMENT', 'CONSULTATION', 'DIAGNOSTIC', 'REFERRAL', 'MEDICINE', 'TELECONSULTATION', 'FOLLOW_UP'],
    required: true
  },
  facilityId: {
    type: String,
    default: ''
  },
  facilityName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'COMPLETED'
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('CareJourneyEvent', careJourneyEventSchema);
