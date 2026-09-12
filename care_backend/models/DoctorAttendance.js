const mongoose = require('mongoose');

const doctorAttendanceSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    department: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    inTime: { type: Date, required: true },
    outTime: { type: Date },
    status: {
      type: String,
      enum: ['PRESENT', 'AVAILABLE', 'IN_CONSULTATION', 'ON_BREAK', 'UNAVAILABLE', 'ABSENT', 'LEFT_EARLY', 'TERMINATED'],
      default: 'PRESENT',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

doctorAttendanceSchema.index({ doctorId: 1, facilityId: 1, date: 1 });

module.exports = mongoose.model('DoctorAttendance', doctorAttendanceSchema);
