const mongoose = require('mongoose');

const intelligenceSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  trend: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  highlights: [{
    type: String
  }],
  breakdown: {
    reports: { type: Object },
    medicines: { type: Object },
    lifestyle: { type: Object },
    stability: { type: Object }
  },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  previousSnapshotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntelligenceSnapshot',
    default: null
  },
  progressionNote: {
    type: String
  },
  dataVersion: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: String,
    default: 'v1'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IntelligenceSnapshot', intelligenceSnapshotSchema);
