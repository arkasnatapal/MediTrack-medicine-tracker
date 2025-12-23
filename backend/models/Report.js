const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folderName: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  domain: {
    type: String,
    default: 'General'
  },
  files: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    fileType: {
      type: String, // 'image' or 'pdf'
      required: true
    },
    originalName: {
      type: String,
      required: true
    }
  }],
  aiAnalysis: {
    type: {
      summary: String,
      detailedAnalysis: String,
      keyFindings: [String],
      healthScore: Number,
      createdAt: Date
    },
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
