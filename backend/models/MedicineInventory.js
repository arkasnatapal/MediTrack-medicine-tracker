const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true
  },
  facilityName: {
    type: String,
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  genericName: {
    type: String,
    required: true
  },
  strength: {
    type: String,
    default: '500 mg'
  },
  dosageForm: {
    type: String,
    default: 'Tablet'
  },
  quantity: {
    type: Number,
    required: true,
    default: 100
  },
  availabilityStatus: {
    type: String,
    enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'],
    default: 'AVAILABLE'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicineInventory', medicineInventorySchema);
