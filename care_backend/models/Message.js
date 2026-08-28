const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationType: {
      type: String,
      enum: ['FACILITY_TO_FACILITY', 'DOCTOR_TO_DOCTOR', 'FACILITY_TO_DOCTOR', 'PATIENT_DOCTOR_POST_SESSION'],
      required: true,
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverName: { type: String },
    senderFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    receiverFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord' },
    teleconsultationSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeleconsultationSession' },
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareReferral' },
    transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientTransfer' },
    messageType: { type: String, enum: ['TEXT', 'VOICE_CLIP', 'DOCUMENT'], default: 'TEXT' },
    content: { type: String, default: '' },
    audioUrl: { type: String }, // Voice clip URL
    attachmentUrl: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareMessage', messageSchema);
