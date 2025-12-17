const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  medicineName: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  error: {
    type: String,
  },
});

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
