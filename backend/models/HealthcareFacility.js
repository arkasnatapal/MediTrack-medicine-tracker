const mongoose = require('mongoose');

const healthcareFacilitySchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  facilityType: {
    type: String,
    enum: ['SUB_CENTER', 'PHC', 'CHC', 'RURAL_HOSPITAL', 'DISTRICT_HOSPITAL', 'OTHER_PUBLIC_FACILITY'],
    required: true
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  district: {
    type: String,
    required: true
  },
  taluka: {
    type: String,
    default: ''
  },
  address: {
    type: String,
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
  phone: {
    type: String,
    default: '108'
  },
  emergencyAvailable: {
    type: Boolean,
    default: true
  },
  ambulanceSupported: {
    type: Boolean,
    default: true
  },
  opdAvailable: {
    type: Boolean,
    default: true
  },
  teleconsultationAvailable: {
    type: Boolean,
    default: false
  },
  specialties: [{
    type: String
  }],
  diagnostics: [{
    name: String,
    available: Boolean,
    waitTimeMinutes: Number
  }],
  medicineServices: [{
    medicineName: String,
    genericName: String,
    quantity: Number,
    available: Boolean
  }],
  operatingHours: {
    type: String,
    default: '24/7'
  },
  isPublicFacility: {
    type: Boolean,
    default: true
  },
  bedCount: {
    total: { type: Number, default: 20 },
    available: { type: Number, default: 8 }
  },
  rating: {
    type: Number,
    default: 4.5
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('HealthcareFacility', healthcareFacilitySchema);
