const mongoose = require('mongoose');

const diagnosticOrderSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRecord', required: true },
    requestingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    testName: { type: String, required: true },
    category: { type: String, enum: ['PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'ULTRASOUND', 'OTHER'], default: 'PATHOLOGY' },
    urgency: { type: String, enum: ['ROUTINE', 'URGENT', 'STAT'], default: 'ROUTINE' },
    status: {
      type: String,
      enum: [
        'ORDERED',
        'ACCEPTED',
        'SCHEDULED',
        'SAMPLE_COLLECTED',
        'PROCESSING',
        'COMPLETED',
        'REPORT_AVAILABLE',
        'CANCELLED',
      ],
      default: 'ORDERED',
    },
    clinicalHistory: { type: String },
    sampleCollectedAt: { type: Date },
    completedAt: { type: Date },
    reportUrl: { type: String },
    testResultsSummary: { type: String },
    performedByStaff: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareDiagnosticOrder', diagnosticOrderSchema);
