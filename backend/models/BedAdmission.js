const mongoose = require('mongoose');

const bedAdmissionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facilityId: {
    type: String,
    required: true
  },
  facilityName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'Emergency Trauma'
  },
  requestedBedType: {
    type: String,
    enum: ['ICU_CCU', 'OXYGEN_BED', 'EMERGENCY_OBSERVATION', 'GENERAL_WARD', 'PEDIATRIC_WARD'],
    default: 'GENERAL_WARD'
  },
  allottedBedType: {
    type: String,
    default: ''
  },
  allottedBedNumber: {
    type: String,
    default: ''
  },
  patientName: String,
  patientAge: String,
  patientGender: String,
  contactPhone: String,
  reasonForAdmission: String,
  status: {
    type: String,
    enum: ['PENDING', 'WAITLISTED', 'APPROVED_BED_ALLOTTED', 'ADMITTED', 'REJECTED', 'DISCHARGED'],
    default: 'PENDING'
  },
  admissionPassNumber: {
    type: String,
    required: true,
    unique: true
  },
  hospitalNotes: String,
  approvedAt: Date,
  dischargedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('BedAdmission', bedAdmissionSchema);
