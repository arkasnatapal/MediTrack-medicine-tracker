const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  emergencyType: {
    type: String,
    enum: ['chest_pain', 'accident', 'breathing', 'pregnancy', 'seizure', 'default'],
    default: 'default'
  },
  assignedHospital: {
    type: Object, // Store simplified hospital data (name, lat, lon)
    default: null
  },
  assignedDoctor: {
    type: Object, // Store simplified doctor data (name, specialty)
    default: null
  },
  status: {
    type: String,
    enum: ['initiated', 'assigned', 'completed'],
    default: 'initiated'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL 24 hours
  }
});

module.exports = mongoose.model('Emergency', emergencySchema);
