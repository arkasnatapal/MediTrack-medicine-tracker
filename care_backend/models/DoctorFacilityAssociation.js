const mongoose = require('mongoose');

const doctorFacilityAssociationSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    department: { type: String, required: true },
    designation: { type: String, default: 'Consultant' },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'VISITING', 'TELE_CONSULTANT', 'HONORARY'],
      default: 'FULL_TIME',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'ENDED'],
      default: 'PENDING',
    },
    requestedBy: {
      type: String,
      enum: ['FACILITY', 'DOCTOR'],
      required: true,
    },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

doctorFacilityAssociationSchema.index({ doctorId: 1, facilityId: 1 }, { unique: true });

module.exports = mongoose.model('DoctorFacilityAssociation', doctorFacilityAssociationSchema);
