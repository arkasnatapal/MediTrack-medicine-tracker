const mongoose = require('mongoose');

const HospitalDetailSchema = new mongoose.Schema({
  hospitalId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: String,
  rating: Number,
  description: String,
  emergencyServices: [String],
  specialties: [String],
  doctors: [{
    name: String,
    specialty: String,
    experience: String,
    availability: String
  }],
  contactNumber: String,
  website: String,
  insuranceAccepted: [String],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('HospitalDetail', HospitalDetailSchema);
