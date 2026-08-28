const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareUser' },
    fullName: { type: String, required: true, trim: true },
    medicalRegistrationNumber: { type: String, required: true, unique: true, trim: true },
    registrationAuthority: { type: String, required: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experienceYears: { type: Number, default: 0 },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    languages: [{ type: String }],
    consultationType: {
      type: String,
      enum: ['IN_PERSON', 'TELECONSULTATION', 'BOTH'],
      default: 'BOTH',
    },
    teleconsultationAvailable: { type: Boolean, default: true },
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

module.exports = mongoose.model('Doctor', doctorSchema);
