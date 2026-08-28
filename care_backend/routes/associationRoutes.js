const express = require('express');
const router = express.Router();
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const Doctor = require('../models/Doctor');
const Facility = require('../models/Facility');
const Notification = require('../models/Notification');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// List associations for current facility or doctor
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'FACILITY_ADMIN' || req.user.role === 'FACILITY_STAFF') {
      const facId = req.query.facilityId || req.user.facilityId;
      if (facId) query.facilityId = facId;
    } else if (req.user.role === 'DOCTOR') {
      const docId = req.query.doctorId || req.user.doctorId;
      if (docId) query.doctorId = docId;
    }

    const associations = await DoctorFacilityAssociation.find(query)
      .populate('doctorId')
      .populate('facilityId')
      .sort({ updatedAt: -1 });

    res.json(associations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Facility invites Doctor OR Doctor requests Facility Association
router.post('/request', protect, authorizeRoles('FACILITY_ADMIN', 'DOCTOR'), async (req, res) => {
  try {
    const { doctorId, facilityId, department, designation, employmentType } = req.body;

    const targetDoctorId = req.user.role === 'DOCTOR' ? req.user.doctorId : doctorId;
    const targetFacilityId = req.user.role === 'FACILITY_ADMIN' ? req.user.facilityId : facilityId;

    if (!targetDoctorId || !targetFacilityId) {
      return res.status(400).json({ message: 'Both Doctor ID and Facility ID are required' });
    }

    const existing = await DoctorFacilityAssociation.findOne({
      doctorId: targetDoctorId,
      facilityId: targetFacilityId,
    });

    if (existing) {
      return res.status(400).json({ message: `Association already exists in state: ${existing.status}` });
    }

    const association = await DoctorFacilityAssociation.create({
      doctorId: targetDoctorId,
      facilityId: targetFacilityId,
      department: department || 'General Medicine',
      designation: designation || 'Consultant Specialist',
      employmentType: employmentType || 'FULL_TIME',
      status: req.user.role === 'FACILITY_ADMIN' ? 'ACTIVE' : 'PENDING',
      requestedBy: req.user.role === 'DOCTOR' ? 'DOCTOR' : 'FACILITY',
    });

    const doctorObj = await Doctor.findById(targetDoctorId);
    const facilityObj = await Facility.findById(targetFacilityId);

    // Notify recipient
    if (req.user.role === 'FACILITY_ADMIN' && doctorObj && doctorObj.userId) {
      await Notification.create({
        recipientId: doctorObj.userId,
        recipientRole: 'DOCTOR',
        type: 'ASSOCIATION_REQUEST',
        title: 'Facility Association Invitation',
        message: `${facilityObj ? facilityObj.name : 'A facility'} has invited you to join their ${department} department.`,
        relatedEntity: 'DoctorFacilityAssociation',
        relatedId: association._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'CREATE_ASSOCIATION_REQUEST', 'DoctorFacilityAssociation', association._id, `Association request created between Doctor ${targetDoctorId} and Facility ${targetFacilityId}`);

    res.status(201).json(association);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve or Reject Association Request
router.put('/:id/status', protect, authorizeRoles('FACILITY_ADMIN', 'DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body; // 'ACTIVE', 'REJECTED', 'SUSPENDED', 'ENDED'
    if (!['ACTIVE', 'REJECTED', 'SUSPENDED', 'ENDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid association status' });
    }

    const association = await DoctorFacilityAssociation.findById(req.params.id)
      .populate('doctorId')
      .populate('facilityId');

    if (!association) return res.status(404).json({ message: 'Association not found' });

    association.status = status;
    if (status === 'ENDED') association.endDate = new Date();
    await association.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_ASSOCIATION_STATUS', 'DoctorFacilityAssociation', association._id, `Set status to ${status}`);

    res.json(association);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
