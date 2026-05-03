const mongoose = require('mongoose');

const dailyStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'bad', 'awful'],
    required: true
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  bodyStatus: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one entry per user per day
dailyStatusSchema.index({ userId: 1, date: 1 }, { unique: true });

dailyStatusSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DailyStatus', dailyStatusSchema);
