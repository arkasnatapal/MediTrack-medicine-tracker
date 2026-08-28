const mongoose = require('mongoose');

const bedGroupSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  occupied: { type: Number, default: 0 },
  available: { type: Number, default: 0 },
});

const facilityCapacitySchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true, unique: true },
    emergencyBeds: bedGroupSchema,
    generalBeds: bedGroupSchema,
    icuBeds: bedGroupSchema,
    oxygenBeds: bedGroupSchema,
    ventilatorsAvailable: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacilityCapacity', facilityCapacitySchema);
