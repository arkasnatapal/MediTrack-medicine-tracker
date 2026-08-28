const express = require('express');
const router = express.Router();
const CareJourneyEvent = require('../models/CareJourneyEvent');
const PatientRecord = require('../models/Patient');

// Get Care Journey visual timeline for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const events = await CareJourneyEvent.find({ patientId: req.params.patientId })
      .populate('facilityId')
      .populate('doctorId')
      .populate('relatedAppointmentId')
      .populate('relatedReferralId')
      .populate('relatedDiagnosticId')
      .populate('relatedTransferId')
      .sort({ timestamp: -1 });

    const patient = await PatientRecord.findById(req.params.patientId);

    res.json({
      patient,
      timeline: events,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search Patient Care Journey by Phone or Name
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const patient = await PatientRecord.findOne({
      $or: [{ phone: query }, { name: new RegExp(query, 'i') }, { email: query }],
    });

    if (!patient) return res.status(404).json({ message: 'Patient record not found' });

    const events = await CareJourneyEvent.find({ patientId: patient._id })
      .populate('facilityId')
      .populate('doctorId')
      .sort({ timestamp: -1 });

    res.json({
      patient,
      timeline: events,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
