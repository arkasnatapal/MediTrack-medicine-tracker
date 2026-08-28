const mongoose = require('mongoose');

const careJourneyEventSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    eventType: {
      type: String,
      enum: [
        'PHC_CONSULTATION',
        'SPECIALIST_CONSULTATION',
        'DIAGNOSTIC_ORDERED',
        'DIAGNOSTIC_COMPLETED',
        'REFERRAL_CREATED',
        'REFERRAL_ACCEPTED',
        'HOSPITAL_TRANSFER',
        'TRANSFER_ACCEPTED',
        'ADMITTED',
        'PRESCRIPTION_ISSUED',
        'FOLLOW_UP_SCHEDULED',
        'TELECONSULTATION_COMPLETED',
      ],
      required: true,
    },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    facilityName: { type: String },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    doctorName: { type: String },
    timestamp: { type: Date, default: Date.now },
    title: { type: String, required: true },
    description: { type: String },
    relatedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareAppointment' },
    relatedReferralId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareReferral' },
    relatedDiagnosticId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareDiagnosticOrder' },
    relatedTransferId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientTransfer' },
    visibility: { type: String, enum: ['PUBLIC_PATIENT', 'CARE_NETWORK_ONLY', 'RESTRICTED'], default: 'PUBLIC_PATIENT' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareJourneyTimelineEvent', careJourneyEventSchema);
