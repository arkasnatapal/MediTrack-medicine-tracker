const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Referral = require('../models/Referral');
const PatientTransfer = require('../models/PatientTransfer');
const Appointment = require('../models/Appointment');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get Pending Registrations (Facilities & Doctors)
router.get('/pending', protect, authorizeRoles('SYSTEM_ADMIN'), async (req, res) => {
  try {
    const facilities = await Facility.find({ verificationStatus: 'PENDING_VERIFICATION' }).sort({ createdAt: -1 });
    const doctors = await Doctor.find({ verificationStatus: 'PENDING_VERIFICATION' }).sort({ createdAt: -1 });
    res.json({ facilities, doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify or Reject Facility
router.put('/verify-facility/:id', protect, authorizeRoles('SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body; // 'VERIFIED', 'REJECTED', 'SUSPENDED'
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    facility.verificationStatus = status;
    if (status === 'VERIFIED') facility.verifiedAt = new Date();
    await facility.save();

    await User.updateMany({ facilityId: facility._id }, { verificationStatus: status });

    await logAudit(req.user._id, req.user.name, req.user.role, 'ADMIN_VERIFY_FACILITY', 'Facility', facility._id, `Set facility ${facility.name} status to ${status}`);

    res.json({ message: `Facility status updated to ${status}`, facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify or Reject Doctor
router.put('/verify-doctor/:id', protect, authorizeRoles('SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body; // 'VERIFIED', 'REJECTED', 'SUSPENDED'
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.verificationStatus = status;
    if (status === 'VERIFIED') doctor.verifiedAt = new Date();
    await doctor.save();

    await User.updateMany({ doctorId: doctor._id }, { verificationStatus: status });

    await logAudit(req.user._id, req.user.name, req.user.role, 'ADMIN_VERIFY_DOCTOR', 'Doctor', doctor._id, `Set doctor ${doctor.fullName} status to ${status}`);

    res.json({ message: `Doctor status updated to ${status}`, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Audit Logs Viewer
router.get('/audit-logs', protect, authorizeRoles('SYSTEM_ADMIN', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// System Analytics Overview
router.get('/metrics', protect, authorizeRoles('SYSTEM_ADMIN'), async (req, res) => {
  try {
    const totalFacilities = await Facility.countDocuments();
    const verifiedFacilities = await Facility.countDocuments({ verificationStatus: 'VERIFIED' });
    const pendingFacilities = await Facility.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' });

    const totalDoctors = await Doctor.countDocuments();
    const verifiedDoctors = await Doctor.countDocuments({ verificationStatus: 'VERIFIED' });
    const pendingDoctors = await Doctor.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' });

    const activeReferrals = await Referral.countDocuments({ status: { $in: ['SENT', 'RECEIVED', 'UNDER_REVIEW', 'ACCEPTED'] } });
    const activeTransfers = await PatientTransfer.countDocuments({ status: { $in: ['REQUESTED', 'ACCEPTED', 'AMBULANCE_REQUESTED', 'IN_TRANSIT'] } });
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      facilities: { total: totalFacilities, verified: verifiedFacilities, pending: pendingFacilities },
      doctors: { total: totalDoctors, verified: verifiedDoctors, pending: pendingDoctors },
      activeReferrals,
      activeTransfers,
      totalAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
