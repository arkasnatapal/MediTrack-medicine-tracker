const mongoose = require('mongoose');

const drugInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicines: [{
    name: { type: String, required: true },
    time: { type: String }
  }],
  analysis: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DrugInteraction', drugInteractionSchema);
