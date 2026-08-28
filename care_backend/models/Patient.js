const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    bloodGroup: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    medicalHistoryNotes: { type: String },
    mediTrackUserId: { type: String }, // Links to existing MediTrack patient User ID
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientRecord', patientSchema);
