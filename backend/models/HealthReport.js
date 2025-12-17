const mongoose = require('mongoose');

const HealthReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  healthScore: {
    type: Number,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  data: {
    type: Object, // Stores the full JSON analysis
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HealthReport', HealthReportSchema);
