const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    referringDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    referringFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    receivingFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    targetDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    referralType: {
      type: String,
      enum: ['DOCTOR_CONSULTATION', 'HOSPITAL_REFERRAL'],
      default: 'DOCTOR_CONSULTATION',
    },
    referralScope: {
      type: String,
      enum: ['INTRA_HOSPITAL', 'INTER_HOSPITAL'],
      default: 'INTRA_HOSPITAL',
    },
    department: { type: String, required: true },
    reason: { type: String, required: true },
    urgency: { type: String, enum: ['ROUTINE', 'URGENT', 'EMERGENCY'], default: 'ROUTINE' },
    clinicalNotes: { type: String },
    requestedServices: [{ type: String }],
    patientFamilyConsent: {
      consentGiven: { type: Boolean, default: false },
      familyMemberName: { type: String },
      familyRelation: { type: String },
      familyContact: { type: String },
      consentNotes: { type: String },
    },
    isInterState: { type: Boolean, default: false },
    interStateConfirmation: {
      confirmed: { type: Boolean, default: false },
      doctorNotes: { type: String },
      doctorConfirmedAt: { type: Date },
    },
    consultationAdvice: {
      providedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      adviceNotes: { type: String },
      recommendedDiagnosis: { type: String },
      recommendedTreatment: { type: String },
      adviceProvidedAt: { type: Date },
    },
    attachedReports: [{ title: String, fileUrl: String, date: Date }],
    status: {
      type: String,
      enum: [
        'CREATED',
        'SENT',
        'RECEIVED',
        'UNDER_REVIEW',
        'ADVICE_PROVIDED',
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
