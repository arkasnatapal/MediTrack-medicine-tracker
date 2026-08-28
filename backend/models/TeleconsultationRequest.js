const mongoose = require('mongoose');

const teleconsultationRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  preferredFacilityId: {
    type: String,
    default: ''
  },
  preferredFacilityName: {
    type: String,
    default: 'District Hospital Tele-Hub'
  },
  symptoms: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'SCHEDULED', 'IN_SESSION', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  scheduledTime: {
    type: String,
    default: 'Today 4:00 PM'
  }
}, { timestamps: true });

module.exports = mongoose.model('TeleconsultationRequest', teleconsultationRequestSchema);
