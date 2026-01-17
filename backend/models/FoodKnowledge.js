const mongoose = require('mongoose');

const FoodKnowledgeSchema = new mongoose.Schema({
  dishName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true // Normalization for searching
  },
  calories: {
    type: String, // e.g., "300 kcal"
    required: true
  },
  nutrients: {
    type: Map,
    of: String
  },
  healthScore: {
    type: Number, // 1-10
    min: 1,
    max: 10
  },
  healthImpact: {
    type: String, // Detailed analysis
    required: true
  },
  recipe: [{
    type: String
  }],
  imageUrl: {
    type: String
  },
  tags: [{
    type: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('FoodKnowledge', FoodKnowledgeSchema);
