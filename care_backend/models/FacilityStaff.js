const mongoose = require('mongoose');

const facilityStaffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareUser', required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    staffRole: {
      type: String,
      enum: ['RECEPTION', 'QUEUE_MANAGER', 'LAB_TECH', 'PHARMACY', 'NURSE', 'ADMINISTRATIVE_WORKER'],
      required: true,
    },
    department: { type: String },
    employeeId: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacilityStaff', facilityStaffSchema);
