const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  form: {
    type: String,
    trim: true,
  },
  // Keeping category for backward compatibility, but removing enum restriction
  category: {
    type: String,
    trim: true,
  },
  genericName: {
    type: String,
    trim: true,
  },
  dosage: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  expiryDate: {
    type: Date,
    // required: true, // Made optional for AI-added medicines
  },
  manufactureDate: {
    type: Date,
  },
  manufacturer: {
    type: String,
    trim: true,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  lowStockAlertSent: {
    type: Boolean,
    default: false,
  },
  outOfStockAlertSent: {
    type: Boolean,
    default: false,
  },
  aiInsights: {
    type: Object,
    default: null,
  },
  folders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineFolder',
  }],
  organizationMetadata: {
    source: {
      type: String,
      enum: ['openfda', 'rxnorm', 'webscrape', 'manual', 'heuristic'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    categorizedAt: {
      type: Date,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

medicineSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);
