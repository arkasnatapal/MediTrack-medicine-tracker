const mongoose = require('mongoose');

const patientTransferSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    originatingFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    destinationFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
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
