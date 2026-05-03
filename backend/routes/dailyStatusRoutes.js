const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const DailyStatus = require('../models/DailyStatus');

// Helper to get normalized IST date (Midnight)
const getNormalizedDate = (date) => {
  const d = new Date(date);
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utc + istOffset);
  istDate.setHours(0, 0, 0, 0);
  return istDate;
};

// GET /api/daily-status/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getNormalizedDate(new Date());

    const status = await DailyStatus.findOne({ userId, date: today });
    res.json({ exists: !!status, status });
  } catch (error) {
    console.error('Error fetching today\'s status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/daily-status
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood, energyLevel, bodyStatus, notes } = req.body;
    const today = getNormalizedDate(new Date());

    let status = await DailyStatus.findOne({ userId, date: today });

    if (status) {
      status.mood = mood || status.mood;
      status.energyLevel = energyLevel || status.energyLevel;
      status.bodyStatus = bodyStatus || status.bodyStatus;
      status.notes = notes !== undefined ? notes : status.notes;
      await status.save();
    } else {
      status = new DailyStatus({
        userId,
        date: today,
        mood,
        energyLevel,
        bodyStatus,
        notes
      });
      await status.save();
    }

    res.status(201).json({ success: true, status });
  } catch (error) {
    console.error('Error saving daily status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
