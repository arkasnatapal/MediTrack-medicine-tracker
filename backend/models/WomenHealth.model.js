const mongoose = require('mongoose');

const womenHealthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  encryptedBlob: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastLogDate: {
    type: Date
  },
  toBeAnalyzedAt: {
    type: Date
  }
});

module.exports = mongoose.model('WomenHealth', womenHealthSchema);
