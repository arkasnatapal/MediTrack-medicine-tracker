const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const FacilityCapacity = require('../models/FacilityCapacity');
const { protect, logAudit } = require('../middleware/authMiddleware');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'meditrack_care_network_super_secret_key_2026', {
    expiresIn: '7d',
  });
};

// Facility Registration Pathway
router.post('/register-facility', async (req, res) => {
  try {
    const {
      facilityName,
      facilityType,
      licenseId,
      classification,
      address,
      state,
      district,
      pincode,
      latitude,
      longitude,
      phone,
      email,
      website,
      emergencyAvailable,
      departments,
      diagnosticServices,
      availableFacilities,
      medicineCapability,
      operatingHours,
      adminName,
      adminEmail,
      password,
    } = req.body;

    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingFacility = await Facility.findOne({ licenseId });
    if (existingFacility) {
      return res.status(400).json({ message: 'Facility with this License ID is already registered' });
    }

    const facility = await Facility.create({
      name: facilityName,
      facilityType,
      licenseId,
      classification,
      address,
      state,
      district,
      pincode,
      latitude: latitude || 0,
      longitude: longitude || 0,
      phone,
      email,
      website,
      emergencyAvailable: !!emergencyAvailable,
      departments: Array.isArray(departments) ? departments : (departments || '').split(',').map(s => s.trim()).filter(Boolean),
      diagnosticServices: Array.isArray(diagnosticServices) ? diagnosticServices : (diagnosticServices || '').split(',').map(s => s.trim()).filter(Boolean),
      availableFacilities: Array.isArray(availableFacilities) ? availableFacilities : (availableFacilities || '').split(',').map(s => s.trim()).filter(Boolean),
      medicineCapability: medicineCapability !== false,
      operatingHours: operatingHours || '24/7 OPD & Emergency',
      adminName,
      adminEmail,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    const user = await User.create({
      name: adminName,
      email: adminEmail,
      phone,
      password,
      role: 'FACILITY_ADMIN',
      facilityId: facility._id,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    await FacilityCapacity.create({
      facilityId: facility._id,
      emergencyBeds: { total: 20, occupied: 5, available: 15 },
      generalBeds: { total: 100, occupied: 40, available: 60 },
      icuBeds: { total: 10, occupied: 4, available: 6 },
      oxygenBeds: { total: 30, occupied: 12, available: 18 },
    });

    await logAudit(user._id, user.name, user.role, 'REGISTER_FACILITY', 'Facility', facility._id, `Facility ${facility.name} registered (PENDING_VERIFICATION)`);

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Facility registered successfully. Account is PENDING_VERIFICATION by System Admin.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        facility: facility,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor Registration Pathway
router.post('/register-doctor', async (req, res) => {
  try {
    const {
      fullName,
      medicalRegistrationNumber,
      registrationAuthority,
      specialization,
      qualification,
      experienceYears,
      phone,
      email,
      password,
      languages,
      consultationType,
      teleconsultationAvailable,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingDoc = await Doctor.findOne({ medicalRegistrationNumber });
    if (existingDoc) {
      return res.status(400).json({ message: 'Doctor with this Medical Registration Number already exists' });
    }

    const user = await User.create({
      name: fullName,
      email,
      phone,
      password,
      role: 'DOCTOR',
      verificationStatus: 'PENDING_VERIFICATION',
    });

    const doctor = await Doctor.create({
      userId: user._id,
      fullName,
      medicalRegistrationNumber,
      registrationAuthority,
      specialization,
      qualification,
      experienceYears: Number(experienceYears) || 0,
      phone,
      email,
      languages: Array.isArray(languages) ? languages : (languages || '').split(',').map(s => s.trim()).filter(Boolean),
      consultationType: consultationType || 'BOTH',
      teleconsultationAvailable: teleconsultationAvailable !== false,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    user.doctorId = doctor._id;
    await user.save();

    await logAudit(user._id, user.name, user.role, 'REGISTER_DOCTOR', 'Doctor', doctor._id, `Doctor ${doctor.fullName} registered (PENDING_VERIFICATION)`);

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Doctor registered successfully. Account is PENDING_VERIFICATION by System Admin.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        doctor: doctor,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Universal Provider Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    let user = await User.findOne({ email: email.toLowerCase() })
      .populate('facilityId')
      .populate('doctorId');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'DOCTOR' && !user.doctorId) {
      const doc = await Doctor.findOne({ userId: user._id });
      if (doc) {
        user.doctorId = doc._id;
        await user.save();
        user = await User.findById(user._id).populate('facilityId').populate('doctorId');
      }
    }

    if (loginType === 'FACILITY' && user.role !== 'FACILITY_ADMIN' && user.role !== 'FACILITY_STAFF' && user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'User is not registered as a Healthcare Facility' });
    }

    if (loginType === 'DOCTOR' && user.role !== 'DOCTOR' && user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'User is not registered as a Doctor' });
    }

    if (loginType === 'ADMIN' && user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'User is not registered as a System Administrator' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit(user._id, user.name, user.role, 'LOGIN', 'CareUser', user._id, `Login successful as ${user.role}`);

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        facility: user.facilityId,
        facilityId: user.facilityId,
        doctor: user.doctorId,
        doctorId: user.doctorId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile route
router.get('/me', protect, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .populate('facilityId')
      .populate('doctorId');

    if (user && user.role === 'DOCTOR' && !user.doctorId) {
      const doc = await Doctor.findOne({ userId: user._id });
      if (doc) {
        user.doctorId = doc._id;
        await user.save();
        user = await User.findById(user._id).populate('facilityId').populate('doctorId');
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
