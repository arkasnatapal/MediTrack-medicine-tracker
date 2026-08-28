const express = require('express');
const router = express.Router();
const PatientTransfer = require('../models/PatientTransfer');
const FacilityCapacity = require('../models/FacilityCapacity');
const Facility = require('../models/Facility');
const CareJourneyEvent = require('../models/CareJourneyEvent');
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
    }

    const transfers = await PatientTransfer.find(query)
      .populate('patientId')
      .populate('originatingFacilityId')
      .populate('destinationFacilityId')
      .populate('accompanyingDoctorId')
      .sort({ createdAt: -1 });

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Emergency Transfer Request
router.post('/', protect, async (req, res) => {
  try {
    const {
      patientId,
      originatingFacilityId,
      destinationFacilityId,
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
    } = req.body;

    // Check Destination Bed Capacity first to inform decision
    const capacity = await FacilityCapacity.findOne({ facilityId: destinationFacilityId });
    let bedAvailable = true;
    if (capacity) {
      if (requiredBedType === 'ICU' && capacity.icuBeds.available <= 0) bedAvailable = false;
      if (requiredBedType === 'EMERGENCY' && capacity.emergencyBeds.available <= 0) bedAvailable = false;
      if (requiredBedType === 'OXYGEN_SUPPORTED' && capacity.oxygenBeds.available <= 0) bedAvailable = false;
    }

    const transfer = await PatientTransfer.create({
      patientId,
      originatingFacilityId: originatingFacilityId || req.user.facilityId,
      destinationFacilityId,
      reason,
      clinicalSummary,
      urgency: urgency || 'CRITICAL',
      requiredDepartment: requiredDepartment || 'Emergency Trauma',
      requiredEquipment: Array.isArray(requiredEquipment) ? requiredEquipment : (requiredEquipment || '').split(',').map(s => s.trim()).filter(Boolean),
      requiredBedType: requiredBedType || 'EMERGENCY',
      ambulanceRequired: ambulanceRequired !== false,
      oxygenRequired: !!oxygenRequired,
      accompanyingDoctorId,
      accompanyingStaffName,
      status: 'REQUESTED',
    });

    const origFac = await Facility.findById(originatingFacilityId || req.user.facilityId);
    const destFac = await Facility.findById(destinationFacilityId);

    // Care Journey Event
    await CareJourneyEvent.create({
      patientId,
      eventType: 'HOSPITAL_TRANSFER',
      facilityId: destFac ? destFac._id : null,
      facilityName: destFac ? destFac.name : 'Destination Hospital',
      title: `Emergency Transfer Requested to ${destFac ? destFac.name : 'Hospital'}`,
      description: `Reason: ${reason}. Bed Required: ${requiredBedType || 'EMERGENCY'}. ${bedAvailable ? 'Bed available at target facility.' : 'WARNING: Bed capacity tight at target facility.'}`,
      relatedTransferId: transfer._id,
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'CREATE_TRANSFER_REQUEST', 'PatientTransfer', transfer._id, `Transfer request sent from ${origFac?.name} to ${destFac?.name}`);

    res.status(201).json({
      transfer,
      capacityWarning: bedAvailable ? null : 'Capacity is currently tight or 0 available beds reported at target facility.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Explicit ACCEPT or REJECT transfer (Per Requirement 10: Receiving hospital must explicitly ACCEPT or REJECT)
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
