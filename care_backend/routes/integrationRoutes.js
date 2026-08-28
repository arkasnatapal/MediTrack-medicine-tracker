const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Referral = require('../models/Referral');
const PatientTransfer = require('../models/PatientTransfer');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const MedicineInventory = require('../models/MedicineInventory');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const TeleconsultationSession = require('../models/TeleconsultationSession');

// Patient integration: Search facilities by location/type
router.get('/facilities', async (req, res) => {
  try {
    const { district, type, emergency } = req.query;
    const query = { verificationStatus: 'VERIFIED' };
    if (district) query.district = new RegExp(district, 'i');
    if (type) query.facilityType = type;
    if (emergency === 'true') query.emergencyAvailable = true;

    const facilities = await Facility.find(query).sort({ name: 1 });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient integration: Get live queue status for token lookup
router.get('/queue-status', async (req, res) => {
  try {
    const { facilityId, department, tokenNumber } = req.query;
    if (!facilityId) return res.status(400).json({ message: 'Facility ID required' });

    const mongoose = require('mongoose');
    const todayStr = new Date().toISOString().split('T')[0];

    let queue = null;
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      queue = await Queue.findOne({
        facilityId,
        department: department || 'General Medicine',
        date: todayStr,
      });
    }

    if (!queue) {
      return res.json({
        servingToken: 101,
        currentToken: 104,
        myToken: Number(tokenNumber) || 102,
        estimatedWaitMinutes: 10,
        status: 'ACTIVE',
      });
    }

    let estimatedWait = 0;
    if (tokenNumber) {
      const myNum = Number(tokenNumber);
      const ahead = Math.max(0, myNum - (queue.servingToken || 100));
      estimatedWait = ahead * 10;
    }

    res.json({
      servingToken: queue.servingToken,
      currentToken: queue.currentToken,
      myToken: Number(tokenNumber) || 102,
      estimatedWaitMinutes: estimatedWait,
      status: queue.isPaused ? 'PAUSED' : 'ACTIVE',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient integration: View Care Journey Timeline
router.get('/care-journey/:patientId', async (req, res) => {
  try {
    const events = await CareJourneyEvent.find({
      patientId: req.params.patientId,
      visibility: 'PUBLIC_PATIENT',
    }).sort({ timestamp: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
