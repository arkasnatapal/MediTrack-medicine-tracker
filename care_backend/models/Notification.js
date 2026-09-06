const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'APPOINTMENT_REQUEST',
        'APPOINTMENT_UPDATE',
        'QUEUE_UPDATE',
        'REFERRAL_RECEIVED',
        'REFERRAL_ACCEPTED',
        'REFERRAL_ADVICE',
        'REFERRAL_COMPLETED',
        'TRANSFER_REQUESTED',
        'TRANSFER_ACCEPTED',
        'TELECONSULTATION_REMINDER',
        'DIAGNOSTIC_REPORT_READY',
        'STOCK_ALERT',
        'ASSOCIATION_REQUEST',
        'NEW_MESSAGE',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareNotification', notificationSchema);
