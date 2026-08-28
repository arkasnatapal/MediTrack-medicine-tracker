const mongoose = require('mongoose');

const teleconsultationSessionSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareAppointment' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord' },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    patientEmail: { type: String },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    facilityName: { type: String },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    doctorName: { type: String },
    specialty: { type: String, required: true },
    symptoms: { type: String, required: true },
    meetingIdentifier: { type: String, required: true, unique: true },
    socketRoomId: { type: String, required: true },
    meetingLink: { type: String },
    scheduledTime: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'REJECTED'],
      default: 'PENDING',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    terminatedAt: { type: Date },
    terminatedBy: { type: String }, // 'DOCTOR', 'PATIENT', or 'SYSTEM'
    // Post-session messaging rule: Patient can send up to 10 follow-up text or audio clip messages after session terminates
    postSessionMessagesLeft: { type: Number, default: 10 },
    postSessionMessagesSent: { type: Number, default: 0 },
    postSessionMessages: [
      {
        sender: { type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
        text: { type: String },
        voiceClipUrl: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    inSessionChat: [
      {
        sender: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    clinicalSummary: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeleconsultationSession', teleconsultationSessionSchema);
