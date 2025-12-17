const mongoose = require('mongoose');

const medicineFolderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#10b981', // emerald-500
  },
  isSystemGenerated: {
    type: Boolean,
    default: false,
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

// Compound index to prevent duplicate folder names per user
medicineFolderSchema.index({ userId: 1, name: 1 }, { unique: true });

medicineFolderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MedicineFolder', medicineFolderSchema);
