const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Checkup = require('../models/Checkup');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/checkups
// @desc    Get all checkups for the user
router.get('/', async (req, res) => {
  try {
    const checkups = await Checkup.find({ user: req.user._id }).sort({ date: 1 });
    res.json(checkups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching checkups' });
  }
});

// @route   POST /api/checkups
// @desc    Create a new checkup
router.post('/', async (req, res) => {
  try {
    const { title, date, time, location, notes, color } = req.body;
    const newCheckup = new Checkup({
      user: req.user._id,
      title,
      date,
      time,
      location,
      notes,
      color
    });

    const savedCheckup = await newCheckup.save();
    res.status(201).json(savedCheckup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating checkup' });
  }
});

// @route   PUT /api/checkups/:id
// @desc    Update a checkup
router.put('/:id', async (req, res) => {
  try {
    const checkup = await Checkup.findById(req.params.id);

    if (!checkup) {
      return res.status(404).json({ message: 'Checkup not found' });
    }

    if (checkup.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedCheckup = await Checkup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedCheckup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating checkup' });
  }
});

// @route   DELETE /api/checkups/:id
// @desc    Delete a checkup
router.delete('/:id', async (req, res) => {
  try {
    const checkup = await Checkup.findById(req.params.id);

    if (!checkup) {
      return res.status(404).json({ message: 'Checkup not found' });
    }

    if (checkup.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await checkup.deleteOne();
    res.json({ message: 'Checkup removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting checkup' });
  }
});

module.exports = router;
