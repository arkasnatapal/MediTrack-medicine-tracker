const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareAppointment' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
  patientName: { type: String, required: true },
  status: {
    type: String,
    enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
    default: 'WAITING',
  },
  checkInTime: { type: Date, default: Date.now },
  startTime: { type: Date },
  endTime: { type: Date },
  durationMinutes: { type: Number },
  estimatedWaitMinutes: { type: Number, default: 15 },
});

const queueSchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    department: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    currentToken: { type: Number, default: 100 },
    servingToken: { type: Number, default: 0 },
    averageConsultationMinutes: { type: Number, default: 7 },
    currentPatientRemainingMinutes: { type: Number, default: 7 },
    currentPatientStartedAt: { type: Date, default: null },
    activeDoctorsCount: { type: Number, default: 1 },
    useRollingAverage: { type: Boolean, default: false },
    recentConsultations: [{
      durationMinutes: Number,
      completedAt: { type: Date, default: Date.now },
      doctorId: String
    }],
    entries: [queueEntrySchema],
    isPaused: { type: Boolean, default: false },
  },
  { timestamps: true }
);

queueSchema.index({ facilityId: 1, department: 1, date: 1 });

module.exports = mongoose.model('CareQueue', queueSchema);

