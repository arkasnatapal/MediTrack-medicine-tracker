const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    referringDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    referringFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    receivingFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    department: { type: String, required: true },
    reason: { type: String, required: true },
    urgency: { type: String, enum: ['ROUTINE', 'URGENT', 'EMERGENCY'], default: 'ROUTINE' },
    clinicalNotes: { type: String },
    requestedServices: [{ type: String }],
    attachedReports: [{ title: String, fileUrl: String, date: Date }],
    status: {
      type: String,
      enum: [
        'CREATED',
        'SENT',
        'RECEIVED',
        'UNDER_REVIEW',
        'ACCEPTED',
        'REJECTED',
        'APPOINTMENT_REQUIRED',
        'SCHEDULED',
        'COMPLETED',
        'CLOSED',
      ],
      default: 'SENT',
    },
    receivingNotes: { type: String },
    scheduledAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareAppointment' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareReferral', referralSchema);
