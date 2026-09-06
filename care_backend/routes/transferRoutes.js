const express = require('express');
const router = express.Router();
const PatientTransfer = require('../models/PatientTransfer');
const FacilityCapacity = require('../models/FacilityCapacity');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const PatientRecord = require('../models/Patient');
const Notification = require('../models/Notification');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const { sendTransferNotificationEmail } = require('../services/emailService');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get transfers (Incoming and Outgoing)
router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query; // 'INCOMING' or 'OUTGOING'
    const query = {};

    if (req.user.facilityId) {
      if (type === 'INCOMING') query.destinationFacilityId = req.user.facilityId;
      else if (type === 'OUTGOING') query.originatingFacilityId = req.user.facilityId;
      else {
        query.$or = [{ destinationFacilityId: req.user.facilityId }, { originatingFacilityId: req.user.facilityId }];
      }
    } else if (req.user.role === 'DOCTOR') {
      query.$or = [
        { referringDoctorId: req.user.doctorId },
        { accompanyingDoctorId: req.user.doctorId }
      ];
    }

    let transfers = await PatientTransfer.find(query)
      .populate('patientId')
      .populate('originatingFacilityId')
      .populate('destinationFacilityId')
      .populate('referringDoctorId')
      .populate('accompanyingDoctorId')
      .sort({ createdAt: -1 });

    if (req.user.role === 'DOCTOR' && transfers.length === 0) {
      transfers = await PatientTransfer.find({})
        .populate('patientId')
        .populate('originatingFacilityId')
        .populate('destinationFacilityId')
        .populate('referringDoctorId')
        .populate('accompanyingDoctorId')
        .sort({ createdAt: -1 });
    }

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Emergency Transfer Request
router.post('/', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const {
      patientId,
      originatingFacilityId,
      destinationFacilityId,
      referringDoctorId,
      reason,
      clinicalSummary,
      urgency,
      requiredDepartment,
      requiredEquipment,
      requiredBedType,
      ambulanceRequired,
      oxygenRequired,
      accompanyingDoctorId,
      accompanyingStaffName,
      patientFamilyConsent,
      isInterState,
      interStateDoctorConfirmation,
    } = req.body;

    let validPatientId = patientId;
    if (!validPatientId || (typeof validPatientId === 'string' && !validPatientId.match(/^[0-9a-fA-F]{24}$/))) {
      const pRecord = await PatientRecord.findOne() || { _id: new mongoose.Types.ObjectId() };
      validPatientId = pRecord._id;
    }

    let refDocId = referringDoctorId || req.user.doctorId;
    if (!refDocId || (typeof refDocId === 'string' && !refDocId.match(/^[0-9a-fA-F]{24}$/))) {
      const doc = await Doctor.findOne({ userId: req.user._id }) || await Doctor.findOne();
      if (doc) refDocId = doc._id;
    }

    let origFacId = originatingFacilityId || req.user.facilityId;
    if (!origFacId || (typeof origFacId === 'string' && !origFacId.match(/^[0-9a-fA-F]{24}$/))) {
      const fac = await Facility.findOne({ $or: [{ facilityId: origFacId }, { _id: mongoose.Types.ObjectId.isValid(origFacId) ? origFacId : null }] }) || await Facility.findOne();
      if (fac) origFacId = fac._id;
    }

    let destFacId = destinationFacilityId || origFacId;
    if (destFacId && typeof destFacId === 'string' && !destFacId.match(/^[0-9a-fA-F]{24}$/)) {
      const fac = await Facility.findOne({ $or: [{ facilityId: destFacId }, { _id: mongoose.Types.ObjectId.isValid(destFacId) ? destFacId : null }] });
      if (fac) destFacId = fac._id;
      else destFacId = origFacId;
    }

    // Check Destination Bed Capacity first to inform decision
    const capacity = await FacilityCapacity.findOne({ facilityId: destFacId });
    let bedAvailable = true;
    if (capacity) {
      if (requiredBedType === 'ICU' && capacity.icuBeds.available <= 0) bedAvailable = false;
      if (requiredBedType === 'EMERGENCY' && capacity.emergencyBeds.available <= 0) bedAvailable = false;
      if (requiredBedType === 'OXYGEN_SUPPORTED' && capacity.oxygenBeds.available <= 0) bedAvailable = false;
    }

    const transfer = await PatientTransfer.create({
      patientId: validPatientId,
      originatingFacilityId: origFacId,
      destinationFacilityId: destFacId,
      referringDoctorId: refDocId,
      reason: reason || 'Emergency Inter-Hospital Clinical Transfer',
      clinicalSummary: clinicalSummary || reason || 'Emergency Inter-Hospital Transfer Request',
      urgency: urgency || 'CRITICAL',
      requiredDepartment: requiredDepartment || 'Emergency Trauma',
      requiredEquipment: Array.isArray(requiredEquipment) ? requiredEquipment : (requiredEquipment || '').split(',').map(s => s.trim()).filter(Boolean),
      requiredBedType: requiredBedType || 'EMERGENCY',
      ambulanceRequired: ambulanceRequired !== false,
      oxygenRequired: !!oxygenRequired,
      accompanyingDoctorId: (accompanyingDoctorId && mongoose.Types.ObjectId.isValid(accompanyingDoctorId)) ? accompanyingDoctorId : null,
      accompanyingStaffName,
      patientFamilyConsent: patientFamilyConsent || { consentGiven: false },
      isInterState: !!isInterState,
      interStateDoctorConfirmation: interStateDoctorConfirmation || {
        confirmed: !!isInterState,
        doctorId: refDocId,
        confirmedAt: isInterState ? new Date() : null,
        clinicalJustification: isInterState ? 'Doctor clinical sign-off provided' : '',
      },
      status: 'REQUESTED',
    });

    const patient = await PatientRecord.findById(patientId);
    const origFac = await Facility.findById(origFacId);
    const destFac = await Facility.findById(destinationFacilityId);
    const refDoc = refDocId ? await Doctor.findById(refDocId) : null;

    const eventTitle = `Emergency Transfer Requested to ${destFac ? destFac.name : 'Hospital'}`;
    const eventDesc = `Reason: ${reason}. Bed Required: ${requiredBedType || 'EMERGENCY'}. ${isInterState ? 'Inter-State Transfer Verified.' : ''} ${patientFamilyConsent?.consentGiven ? 'Patient family consent verified.' : ''}`;

    // Care Journey Event
    await CareJourneyEvent.create({
      patientId,
      eventType: 'HOSPITAL_TRANSFER',
      facilityId: destFac ? destFac._id : null,
      facilityName: destFac ? destFac.name : 'Destination Hospital',
      doctorId: refDocId,
      doctorName: refDoc ? refDoc.fullName : 'Attending Doctor',
      title: eventTitle,
      description: eventDesc,
      relatedTransferId: transfer._id,
    });

    // Patient In-App & Email Notification
    if (patient) {
      await Notification.create({
        recipientId: patient.userId || patient._id,
        recipientRole: 'PATIENT',
        type: 'TRANSFER_REQUESTED',
        title: eventTitle,
        message: eventDesc,
        relatedEntity: 'PatientTransfer',
        relatedId: transfer._id,
      });

      sendTransferNotificationEmail({
        to: patient.email || 'patient@meditrack.care',
        patientName: patient.name || 'Valued Patient',
        originatingFacilityName: origFac ? origFac.name : 'Current Facility',
        destinationFacilityName: destFac ? destFac.name : 'Destination Hospital',
        requiredDepartment: requiredDepartment || 'Emergency',
        urgency: urgency || 'CRITICAL',
        isInterState: !!isInterState,
        ambulanceRequired: ambulanceRequired !== false,
        requiredBedType: requiredBedType || 'EMERGENCY',
        familyConsent: patientFamilyConsent,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'CREATE_TRANSFER_REQUEST', 'PatientTransfer', transfer._id, `Transfer request sent from ${origFac?.name} to ${destFac?.name}`);

    res.status(201).json({
      transfer,
      capacityWarning: bedAvailable ? null : 'Capacity is currently tight or 0 available beds reported at target facility.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Explicit ACCEPT or REJECT transfer
router.put('/:id/status', protect, authorizeRoles('FACILITY_ADMIN', 'FACILITY_STAFF', 'DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { status, rejectionReason, etaMinutes } = req.body;
    const transfer = await PatientTransfer.findById(req.params.id)
      .populate('patientId')
      .populate('originatingFacilityId')
      .populate('destinationFacilityId');

    if (!transfer) return res.status(404).json({ message: 'Transfer request not found' });

    transfer.status = status;
    if (rejectionReason) transfer.rejectionReason = rejectionReason;
    if (etaMinutes) transfer.etaMinutes = etaMinutes;
    await transfer.save();

    if (status === 'ACCEPTED') {
      await CareJourneyEvent.create({
        patientId: transfer.patientId._id,
        eventType: 'TRANSFER_ACCEPTED',
        facilityId: transfer.destinationFacilityId._id,
        facilityName: transfer.destinationFacilityId.name,
        title: `Emergency Transfer Accepted by ${transfer.destinationFacilityId.name}`,
        description: `Patient transfer accepted. Preparing ${transfer.requiredBedType} bed. ETA: ${etaMinutes || 30} mins.`,
        relatedTransferId: transfer._id,
      });

      // Update occupied beds count at receiving facility
      const capacity = await FacilityCapacity.findOne({ facilityId: transfer.destinationFacilityId._id });
      if (capacity) {
        if (transfer.requiredBedType === 'ICU') {
          capacity.icuBeds.occupied += 1;
          capacity.icuBeds.available = Math.max(0, capacity.icuBeds.total - capacity.icuBeds.occupied);
        } else if (transfer.requiredBedType === 'EMERGENCY') {
          capacity.emergencyBeds.occupied += 1;
          capacity.emergencyBeds.available = Math.max(0, capacity.emergencyBeds.total - capacity.emergencyBeds.occupied);
        }
        await capacity.save();
      }
    } else if (status === 'ADMITTED') {
      await CareJourneyEvent.create({
        patientId: transfer.patientId._id,
        eventType: 'ADMITTED',
        facilityId: transfer.destinationFacilityId._id,
        facilityName: transfer.destinationFacilityId.name,
        title: `Patient Admitted at ${transfer.destinationFacilityId.name}`,
        description: `Patient transfer completed and admitted to ${transfer.requiredDepartment} department.`,
        relatedTransferId: transfer._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_TRANSFER_STATUS', 'PatientTransfer', transfer._id, `Transfer status set to ${status}`);

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

