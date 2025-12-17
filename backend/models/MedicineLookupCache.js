const mongoose = require('mongoose');

const medicineLookupCacheSchema = new mongoose.Schema({
  normalizedName: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  originalNames: [{
    type: String,
    trim: true,
  }],
  indications: [{
    type: String,
    trim: true,
  }],
  categories: [{
    type: String,
    trim: true,
  }],
  source: {
    type: String,
    enum: ['openfda', 'rxnorm', 'webscrape', 'manual', 'heuristic'],
    required: true,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  manualOverride: {
    type: Boolean,
    default: false,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    index: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
});

// TTL index to auto-delete expired cache entries
medicineLookupCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

medicineLookupCacheSchema.pre('save', function (next) {
  this.lastChecked = Date.now();
  // Don't update expiry if manual override
  if (!this.manualOverride && this.isModified('indications')) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('MedicineLookupCache', medicineLookupCacheSchema);
