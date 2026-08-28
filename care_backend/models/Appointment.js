const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    department: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    type: { type: String, enum: ['IN_PERSON', 'TELECONSULTATION'], default: 'IN_PERSON' },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'PENDING_CONFIRMATION',
        'CONFIRMED',
        'CHECKED_IN',
        'WAITING',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'RESCHEDULED',
      ],
      default: 'REQUESTED',
    },
    symptoms: { type: String },
    triageLevel: { type: String, enum: ['NORMAL', 'URGENT', 'CRITICAL'], default: 'NORMAL' },
    tokenNumber: { type: Number },
    notes: { type: String },
    prescription: {
      diagnosis: { type: String },
      medicines: [
        {
          name: { type: String },
          dosage: { type: String },
          frequency: { type: String },
          duration: { type: String },
          instructions: { type: String },
        },
      ],
      advice: { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareAppointment', appointmentSchema);
