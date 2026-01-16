const mongoose = require('mongoose');

const ayurvedicProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Static/Semi-static Constitution (Dosha)
  constituency: {
    vata: { type: Number, default: 0 }, // 0-100
    pitta: { type: Number, default: 0 },
    kapha: { type: Number, default: 0 },
    primary: { type: String, default: 'Unknown' } 
  },
  // Women's Cycle Tracking
  cycleData: {
    lastPeriodDate: Date,
    cycleLength: { type: Number, default: 28 },
    isTracking: { type: Boolean, default: false }
  },
  // Food Habits & Lifestyle
  lifestyle: {
    dietaryPreference: { type: String, default: 'Omnivore' }, // Veg, Vegan, etc.
    sleepPattern: String,
    activityLevel: String
  },
  // Daily Feedback History (Keep last 30 days for context)
  dailyFeedback: [{
    date: { type: Date, default: Date.now },
    mood: String,
    energyLevel: Number, // 1-10
    digestion: String, // Good, Bloated, Constipated, etc.
    symptoms: [String],
    notes: String
  }],
  // The Daily Recommendation (Refreshes every 24h)
  dailySuggestion: {
    generatedAt: Date,
    validUntil: Date,
    content: {
      focus: String, // e.g., "Calming Pitta"
      diet: [String],
      lifestyle: [String],
      herbs: [String],
      yoga: {
        name: String,
        benefits: String,
        imageUrl: String // Optional: can be empty or AI generated link
      },
      quote: String
    }
  },
  activeReminders: [{
    title: String,
    category: String,
    instruction: String,
    frequency: { type: String, default: 'Daily' },
    durationDays: { type: Number, default: 3 },
    scheduledTime: String,
    googleEventId: String,
    createdAt: { type: Date, default: Date.now }
  }],
  geneticInsights: [{
    condition: String,
    recommendation: String,
    category: { type: String, default: 'General' }
  }],
  healingPath: {
    title: String, // e.g., "Hypertension Management" or "Preventative Care"
    description: String,
    source: String, // e.g. "Based on predicted risk of Diabetes"
    recommendations: [{
      category: { type: String },
      title: String,
      content: String,
      timeToPerform: String,
      imageQuery: String // Keyword to find/show an image
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ayurvedicProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AyurvedicProfile', ayurvedicProfileSchema);
