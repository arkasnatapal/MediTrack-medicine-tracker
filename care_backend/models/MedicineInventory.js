const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    medicineName: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    strength: { type: String, required: true }, // e.g. '500mg'
    dosageForm: { type: String, required: true }, // e.g. 'Tablet', 'Syrup', 'Injection'
    quantity: { type: Number, required: true, min: 0 },
    minimumThreshold: { type: Number, default: 50 },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    unitPrice: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED'],
      default: 'AVAILABLE',
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

medicineInventorySchema.pre('save', function (next) {
  const now = new Date();
  if (this.expiryDate && this.expiryDate < now) {
    this.status = 'EXPIRED';
  } else if (this.quantity <= 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (this.quantity <= this.minimumThreshold) {
    this.status = 'LOW_STOCK';
  } else {
    this.status = 'AVAILABLE';
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('CareMedicineInventory', medicineInventorySchema);
