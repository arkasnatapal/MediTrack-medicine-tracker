const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    facilityType: {
      type: String,
      enum: ['PHC', 'CHC', 'RURAL_HOSPITAL', 'DISTRICT_HOSPITAL', 'GOVT_HOSPITAL', 'PUBLIC_HEALTHCARE', 'DIAGNOSTIC_CENTRE', 'OTHER'],
      required: true,
    },
    licenseId: { type: String, required: true, unique: true, trim: true },
    classification: { type: String, enum: ['GOVERNMENT', 'PRIVATE', 'PUBLIC_PRIVATE_PARTNERSHIP'], default: 'GOVERNMENT' },
    address: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    website: { type: String },
    emergencyAvailable: { type: Boolean, default: false },
    departments: [{ type: String }],
    diagnosticServices: [{ type: String }],
    availableFacilities: [{ type: String }],
    medicineCapability: { type: Boolean, default: true },
    operatingHours: { type: String, default: '24/7 OPD & Emergency' },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true, lowercase: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'CareUser' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Facility', facilitySchema);
