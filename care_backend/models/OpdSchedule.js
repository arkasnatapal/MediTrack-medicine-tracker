const mongoose = require('mongoose');

const opdScheduleSchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    department: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    operatingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    openTime: { type: String, default: '09:00' }, // 24-hr HH:mm
    closeTime: { type: String, default: '13:00' }, // 24-hr HH:mm
    breakStart: { type: String, default: '11:30' }, // 24-hr HH:mm
    breakEnd: { type: String, default: '12:00' }, // 24-hr HH:mm
    lastTokenTime: { type: String, default: '12:30' }, // 24-hr HH:mm cutoff for new registrations
    closingWarningMinutes: { type: Number, default: 30 },
    queueMode: {
      type: String,
      enum: ['SHARED_QUEUE', 'DOCTOR_SPECIFIC_QUEUE'],
      default: 'SHARED_QUEUE',
    },
    closingPolicy: {
      type: String,
      enum: ['COMPLETE_EXISTING', 'CANCEL_REMAINING', 'RESCHEDULE_REMAINING'],
      default: 'COMPLETE_EXISTING',
    },
    holidays: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        description: { type: String },
      },
    ],
    specialDateOverrides: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        status: { type: String, enum: ['OPEN', 'CLOSED', 'HOLIDAY', 'MODIFIED'] },
        openTime: { type: String },
        closeTime: { type: String },
        lastTokenTime: { type: String },
        breakStart: { type: String },
        breakEnd: { type: String },
        reason: { type: String },
      },
    ],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

opdScheduleSchema.index({ facilityId: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('OpdSchedule', opdScheduleSchema);
