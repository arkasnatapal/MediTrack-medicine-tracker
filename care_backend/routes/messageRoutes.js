const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Get active conversations & history
router.get('/', protect, async (req, res) => {
  try {
    const { receiverId, conversationType } = req.query;
    const query = {
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    };

    if (receiverId) {
      query.$or = [
        { senderId: req.user._id, receiverId },
        { senderId: receiverId, receiverId: req.user._id },
      ];
    }
    if (conversationType) query.conversationType = conversationType;

    const messages = await Message.find(query).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send Message (Text or Voice Clip)
router.post('/', protect, async (req, res) => {
  try {
    const {
      conversationType,
      receiverId,
      receiverName,
      senderFacilityId,
      receiverFacilityId,
      patientId,
      referralId,
      transferId,
      messageType,
      content,
      audioUrl,
    } = req.body;

    const message = await Message.create({
      conversationType: conversationType || 'DOCTOR_TO_DOCTOR',
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      receiverId,
      receiverName,
      senderFacilityId: senderFacilityId || req.user.facilityId,
      receiverFacilityId,
      patientId,
      referralId,
      transferId,
      messageType: messageType || (audioUrl ? 'VOICE_CLIP' : 'TEXT'),
      content: content || '',
      audioUrl,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
