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
  medicationInsights: [{
    type: String
  }],
  breakdown: {
    reports: { type: Object },
    medicines: { type: Object },
    lifestyle: { type: Object },
    stability: { type: Object }
  },
  // New Domain-Aware Architecture
  domains: {
    type: Map,
    of: new mongoose.Schema({
      summary: String,
      healthScore: Number,
      lastAnalyzedAt: Date,
      trend: String,
      keyFindings: [String]
    }, { _id: false }),
    default: {}
  },
  globalAdherence: {
    summary: String,
    score: Number,
    issues: [String],
    lastAnalyzedAt: Date
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
  predictedThreat: {
    title: { type: String },
    severity: { type: String, enum: ['high', 'medium', 'low'] },
    timeframe: { type: String }, // e.g., "Next 6 days"
    description: { type: String },
    suggestions: [{ type: String }],
    reasoning: [{ type: String }],
    predictionBasis: [{ type: String }] // [NEW] Stores context like "Glucose (Stable), Cardiac (Declining)"
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
