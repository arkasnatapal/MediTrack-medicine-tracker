const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SYSTEM_ADMIN', 'FACILITY_ADMIN', 'DOCTOR', 'FACILITY_STAFF', 'LAB_STAFF', 'PHARMACY_STAFF'],
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
    },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('CareUser', userSchema);
