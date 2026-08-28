const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Search registered doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, search, teleconsultation } = req.query;
    const query = { verificationStatus: { $ne: 'REJECTED' } };

    if (specialization) query.specialization = new RegExp(specialization, 'i');
    if (teleconsultation === 'true') query.teleconsultationAvailable = true;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') },
        { qualification: new RegExp(search, 'i') },
      ];
    }

    const doctors = await Doctor.find(query).sort({ fullName: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor details by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const associations = await DoctorFacilityAssociation.find({
      doctorId: doctor._id,
      status: 'ACTIVE',
    }).populate('facilityId');

    res.json({
      doctor,
      associatedFacilities: associations.map(a => ({
        associationId: a._id,
        department: a.department,
        designation: a.designation,
        employmentType: a.employmentType,
        facility: a.facilityId,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Doctor profile (Doctor only)
router.put('/:id', protect, authorizeRoles('DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (req.user.role === 'DOCTOR' && req.user.doctorId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden - Cannot update another doctor profile' });
    }

    Object.assign(doctor, req.body);
    await doctor.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_DOCTOR', 'Doctor', doctor._id, `Updated profile for Dr. ${doctor.fullName}`);

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
