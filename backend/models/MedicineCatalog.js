const mongoose = require('mongoose');

const medicineCatalogSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    index: true, // Indexed for faster search
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  dosageInfo: {
    type: String,
    trim: true
  },
  commonUses: [{
    type: String,
    trim: true
  }],
  precautions: [{
    type: String,
    trim: true
  }],
  imageUrl: {
    type: String, // Cloudinary URL
    trim: true
  },
  createdBy: {
    type: String,
    enum: ['ai', 'manual'],
    default: 'ai'
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for case-insensitive search might be useful, 
// but for now relying on regex search in controller.
// Adding a text index for broader search capabilities if needed later.
medicineCatalogSchema.index({ brandName: 'text', genericName: 'text' });

// Use the 'medicines' database instead of the default one
const medicineDb = mongoose.connection.useDb('medicines');

module.exports = medicineDb.model('MedicineCatalog', medicineCatalogSchema);
