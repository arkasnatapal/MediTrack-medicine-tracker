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
  description: {
    type: String, // User's description of the problem
    default: ''
  },
  aiAnalysis: {
    type: Object, // Summary/Recommendation from AI
    default: null
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
    enum: ['initiated', 'assigned', 'completed', 'cancelled'],
    default: 'initiated'
  },
  createdAt: {
    type: Date,
    default: Date.now
    // Removed expires/TTL to keep history permanent
  }
});

module.exports = mongoose.model('Emergency', emergencySchema);
