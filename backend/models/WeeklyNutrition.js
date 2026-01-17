const mongoose = require("mongoose");

const WeeklyNutritionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  macroBreakdown: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    fiber: Number,
    sugar: Number
  },
  diseaseAnalysis: {
    condition: String,
    impactScore: Number, // 1-10
    explanation: String,
    beneficialFoods: [String],
    avoidFoods: [String]
  },
  visualData: [{
    name: String,
    value: Number,
    fill: String // Color for chart
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent multiple reports for the same day (rate limiting at model level optional, but good for index)
WeeklyNutritionSchema.index({ user: 1, generatedAt: -1 });

module.exports = mongoose.model("WeeklyNutrition", WeeklyNutritionSchema);
