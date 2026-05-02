const mongoose = require('mongoose');

const dailyInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  gradient: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['nutrition', 'exercise', 'medicine', 'mental_health', 'sleep'],
    default: 'nutrition'
  },
  reasoning: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure one insight per user per day
dailyInsightSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyInsight', dailyInsightSchema);
