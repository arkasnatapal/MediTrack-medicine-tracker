const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true
  },
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
    default: 'General OPD'
  },
  doctorId: {
    type: String,
    default: 'Dr. Available Duty Medical Officer'
  },
  doctorName: {
    type: String,
    default: 'Duty Medical Officer'
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'BOOKED',
      'PENDING_APPROVAL',
      'REQUESTED',
      'PENDING_CONFIRMATION',
      'CONFIRMED',
      'CHECKED_IN',
      'IN_QUEUE',
      'WAITING',
      'IN_CONSULTATION',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'RESCHEDULED',
    ],
    default: 'BOOKED'
  },
  reasonForVisit: {
    type: String,
    default: 'General Consultation'
  },
  triagePriority: {
    type: String,
    enum: ['ROUTINE', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'ROUTINE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
