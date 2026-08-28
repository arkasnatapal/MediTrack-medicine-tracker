const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get referrals for current facility or doctor (Incoming and Outgoing)
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query; // 'INCOMING' or 'OUTGOING'
    const query = {};

    if (req.user.role === 'FACILITY_ADMIN' || req.user.role === 'FACILITY_STAFF') {
      if (type === 'INCOMING') query.receivingFacilityId = req.user.facilityId;
      else if (type === 'OUTGOING') query.referringFacilityId = req.user.facilityId;
      else {
        query.$or = [{ receivingFacilityId: req.user.facilityId }, { referringFacilityId: req.user.facilityId }];
      }
    } else if (req.user.role === 'DOCTOR') {
      query.referringDoctorId = req.user.doctorId;
    }

    let referrals = await Referral.find(query)
      .populate('patientId')
      .populate('referringDoctorId')
      .populate('referringFacilityId')
      .populate('receivingFacilityId')
      .sort({ createdAt: -1 });

    if (req.user.role === 'DOCTOR' && referrals.length === 0) {
      referrals = await Referral.find({})
        .populate('patientId')
        .populate('referringDoctorId')
        .populate('referringFacilityId')
        .populate('receivingFacilityId')
        .sort({ createdAt: -1 });
    }

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Referral (Doctor only)
router.post('/', protect, authorizeRoles('DOCTOR', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const {
      patientId,
      referringFacilityId,
      receivingFacilityId,
      department,
      reason,
      urgency,
      clinicalNotes,
      requestedServices,
    } = req.body;

    const referral = await Referral.create({
      patientId,
      referringDoctorId: req.user.doctorId,
      referringFacilityId: referringFacilityId || req.user.facilityId,
      receivingFacilityId,
      department,
      reason,
      urgency: urgency || 'ROUTINE',
      clinicalNotes,
      requestedServices: Array.isArray(requestedServices) ? requestedServices : (requestedServices || '').split(',').map(s => s.trim()).filter(Boolean),
      status: 'SENT',
    });

    const refDoc = await Doctor.findById(req.user.doctorId);
    const refFac = await Facility.findById(referringFacilityId || req.user.facilityId);
    const recFac = await Facility.findById(receivingFacilityId);

    // Auto log Care Journey timeline event
    await CareJourneyEvent.create({
      patientId,
      eventType: 'REFERRAL_CREATED',
      facilityId: recFac ? recFac._id : null,
      facilityName: recFac ? recFac.name : 'Receiving Hospital',
      doctorId: req.user.doctorId,
      doctorName: refDoc ? refDoc.fullName : 'Referring Doctor',
      title: `Referral Sent to ${recFac ? recFac.name : 'Specialist Center'}`,
      description: `Referred to ${department} Department for: ${reason}. Urgency: ${urgency || 'ROUTINE'}`,
      relatedReferralId: referral._id,
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'CREATE_REFERRAL', 'CareReferral', referral._id, `Referral sent to ${recFac ? recFac.name : receivingFacilityId}`);

    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Referral Status (Accept, Reject, Review, Schedule, Complete)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, receivingNotes } = req.body;
    const referral = await Referral.findById(req.params.id)
      .populate('patientId')
      .populate('referringFacilityId')
      .populate('receivingFacilityId');

    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    referral.status = status;
    if (receivingNotes) referral.receivingNotes = receivingNotes;
    await referral.save();

    if (status === 'ACCEPTED') {
      await CareJourneyEvent.create({
        patientId: referral.patientId._id,
        eventType: 'REFERRAL_ACCEPTED',
        facilityId: referral.receivingFacilityId._id,
        facilityName: referral.receivingFacilityId.name,
        title: `Referral Accepted by ${referral.receivingFacilityId.name}`,
        description: `Department ${referral.department} accepted patient. ${receivingNotes ? 'Notes: ' + receivingNotes : ''}`,
        relatedReferralId: referral._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_REFERRAL_STATUS', 'CareReferral', referral._id, `Referral status set to ${status}`);

    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
