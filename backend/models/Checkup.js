const mongoose = require('mongoose');

const checkupSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#10b981' // default emerald
  },
  reminded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Checkup', checkupSchema);
