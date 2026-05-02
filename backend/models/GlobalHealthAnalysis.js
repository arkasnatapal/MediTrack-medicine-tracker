const mongoose = require('mongoose');

const globalHealthAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  domains: [{
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 }
  }],
  flaws: {
    type: String,
    required: true
  },
  causes: {
    type: String,
    required: true
  },
  copingMechanisms: {
    type: String,
    required: true
  },
  prevention: {
    type: String,
    required: true
  },
  synopsis: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GlobalHealthAnalysis', globalHealthAnalysisSchema);
