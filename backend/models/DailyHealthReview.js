const mongoose = require('mongoose');

const dailyHealthReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewForDate: {
    type: Date,
    required: true,
    index: true // Helps in querying by date
  },
  mood: {
    type: String,
    enum: ['good', 'neutral', 'bad'],
    required: true
  },
  reviewText: {
    type: String,
    trim: true,
    maxlength: 500 // Limit to avoid massive text
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one review per user per date
dailyHealthReviewSchema.index({ userId: 1, reviewForDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyHealthReview', dailyHealthReviewSchema);
