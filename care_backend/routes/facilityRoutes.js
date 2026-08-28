const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const FacilityCapacity = require('../models/FacilityCapacity');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const Doctor = require('../models/Doctor');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get all verified facilities (Public / Network search)
router.get('/', async (req, res) => {
  try {
    const { type, district, state, search } = req.query;
    const query = { verificationStatus: 'VERIFIED' };

    if (type) query.facilityType = type;
    if (district) query.district = new RegExp(district, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { district: new RegExp(search, 'i') },
      ];
    }

    const facilities = await Facility.find(query).sort({ name: 1 });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get facility details by ID
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    const capacity = await FacilityCapacity.findOne({ facilityId: facility._id });
    const associations = await DoctorFacilityAssociation.find({
      facilityId: facility._id,
      status: 'ACTIVE',
    }).populate('doctorId');

    res.json({
      facility,
      capacity: capacity || {
        emergencyBeds: { total: 0, occupied: 0, available: 0 },
        generalBeds: { total: 0, occupied: 0, available: 0 },
        icuBeds: { total: 0, occupied: 0, available: 0 },
        oxygenBeds: { total: 0, occupied: 0, available: 0 },
      },
      doctors: associations.map(a => ({
        _id: a.doctorId?._id || a.doctorId,
        fullName: a.doctorId?.fullName || 'Doctor',
        specialization: a.doctorId?.specialization || 'Specialist',
        qualification: a.doctorId?.qualification || 'MBBS',
        associationId: a._id,
        department: a.department,
        designation: a.designation,
        employmentType: a.employmentType,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Facility Details (Facility Admin only)
router.put('/:id', protect, authorizeRoles('FACILITY_ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    if (req.user.role === 'FACILITY_ADMIN' && req.user.facilityId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden - Cannot update another facility' });
    }

    Object.assign(facility, req.body);
    await facility.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_FACILITY', 'Facility', facility._id, `Updated details for ${facility.name}`);

    res.json(facility);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Facility Capacity / Beds (Facility Admin / Staff)
router.put('/:id/capacity', protect, authorizeRoles('FACILITY_ADMIN', 'FACILITY_STAFF', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    let capacity = await FacilityCapacity.findOne({ facilityId: req.params.id });
    if (!capacity) {
      capacity = new FacilityCapacity({ facilityId: req.params.id });
    }

    const { emergencyBeds, generalBeds, icuBeds, oxygenBeds, ventilatorsAvailable } = req.body;

    if (emergencyBeds) {
      capacity.emergencyBeds.total = emergencyBeds.total ?? capacity.emergencyBeds.total;
      capacity.emergencyBeds.occupied = emergencyBeds.occupied ?? capacity.emergencyBeds.occupied;
      capacity.emergencyBeds.available = Math.max(0, capacity.emergencyBeds.total - capacity.emergencyBeds.occupied);
    }
    if (generalBeds) {
      capacity.generalBeds.total = generalBeds.total ?? capacity.generalBeds.total;
      capacity.generalBeds.occupied = generalBeds.occupied ?? capacity.generalBeds.occupied;
      capacity.generalBeds.available = Math.max(0, capacity.generalBeds.total - capacity.generalBeds.occupied);
    }
    if (icuBeds) {
      capacity.icuBeds.total = icuBeds.total ?? capacity.icuBeds.total;
      capacity.icuBeds.occupied = icuBeds.occupied ?? capacity.icuBeds.occupied;
      capacity.icuBeds.available = Math.max(0, capacity.icuBeds.total - capacity.icuBeds.occupied);
    }
    if (oxygenBeds) {
      capacity.oxygenBeds.total = oxygenBeds.total ?? capacity.oxygenBeds.total;
      capacity.oxygenBeds.occupied = oxygenBeds.occupied ?? capacity.oxygenBeds.occupied;
      capacity.oxygenBeds.available = Math.max(0, capacity.oxygenBeds.total - capacity.oxygenBeds.occupied);
    }
    if (ventilatorsAvailable !== undefined) {
      capacity.ventilatorsAvailable = ventilatorsAvailable;
    }

    capacity.lastUpdated = new Date();
    await capacity.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_CAPACITY', 'FacilityCapacity', capacity._id, `Updated bed capacity`);

    res.json(capacity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
