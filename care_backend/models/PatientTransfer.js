const mongoose = require('mongoose');

const patientTransferSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    originatingFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    destinationFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    referringDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    reason: { type: String, required: true },
    clinicalSummary: { type: String, required: true },
    urgency: { type: String, enum: ['NORMAL', 'URGENT', 'CRITICAL'], default: 'CRITICAL' },
    requiredDepartment: { type: String, required: true },
    requiredEquipment: [{ type: String }],
    requiredBedType: {
      type: String,
      enum: ['EMERGENCY', 'GENERAL', 'ICU', 'OXYGEN_SUPPORTED'],
      default: 'EMERGENCY',
    },
    ambulanceRequired: { type: Boolean, default: true },
    oxygenRequired: { type: Boolean, default: false },
    accompanyingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    accompanyingStaffName: { type: String },
    patientFamilyConsent: {
      consentGiven: { type: Boolean, default: false },
      familyMemberName: { type: String },
      familyRelation: { type: String },
      familyContact: { type: String },
      consentNotes: { type: String },
    },
    isInterState: { type: Boolean, default: false },
    interStateDoctorConfirmation: {
      confirmed: { type: Boolean, default: false },
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      confirmedAt: { type: Date },
      clinicalJustification: { type: String },
    },
    attachedReports: [{ title: String, fileUrl: String }],
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'ACCEPTED',
        'REJECTED',
        'AMBULANCE_REQUESTED',
        'IN_TRANSIT',
        'ARRIVED',
        'ADMITTED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    rejectionReason: { type: String },
    etaMinutes: { type: Number, default: 30 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientTransfer', patientTransferSchema);

