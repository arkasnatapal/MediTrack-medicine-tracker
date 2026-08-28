const mongoose = require('mongoose');

const facilityContactInfoSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  facilityName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  lastVerifiedDate: {
    type: Date,
    default: Date.now
  },
  sourceOfInformation: {
    type: String,
    default: 'Official Government / Hospital Registry (MoHFW)'
  },
  isVerified: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FacilityContactInfo', facilityContactInfoSchema);
