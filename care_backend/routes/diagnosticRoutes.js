const express = require('express');
const router = express.Router();
const DiagnosticOrder = require('../models/DiagnosticOrder');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Facility = require('../models/Facility');
const Doctor = require('../models/Doctor');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get diagnostic lab orders
router.get('/', protect, async (req, res) => {
  try {
    const query = {};
    if (req.user.facilityId) query.facilityId = req.user.facilityId;
    if (req.user.role === 'DOCTOR') query.requestingDoctorId = req.user.doctorId;
    if (req.query.patientId) query.patientId = req.query.patientId;

    const orders = await DiagnosticOrder.find(query)
      .populate('patientId')
      .populate('requestingDoctorId')
      .populate('facilityId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Order Diagnostic Test (Doctor only)
router.post('/', protect, authorizeRoles('DOCTOR', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { patientId, facilityId, testName, category, urgency, clinicalHistory } = req.body;

    const order = await DiagnosticOrder.create({
      patientId,
      requestingDoctorId: req.user.doctorId,
      facilityId: facilityId || req.user.facilityId,
      testName,
      category: category || 'PATHOLOGY',
      urgency: urgency || 'ROUTINE',
      clinicalHistory,
      status: 'ORDERED',
    });

    const doc = await Doctor.findById(req.user.doctorId);
    const fac = await Facility.findById(facilityId || req.user.facilityId);

    // Care Journey Event
    await CareJourneyEvent.create({
      patientId,
      eventType: 'DIAGNOSTIC_ORDERED',
      facilityId: fac ? fac._id : null,
      facilityName: fac ? fac.name : 'Facility',
      doctorId: req.user.doctorId,
      doctorName: doc ? doc.fullName : 'Doctor',
      title: `Diagnostic Test Ordered: ${testName}`,
      description: `Category: ${category}. Urgency: ${urgency}. Clinical Note: ${clinicalHistory || 'None'}`,
      relatedDiagnosticId: order._id,
    });

    await logAudit(req.user._id, req.user.name, req.user.role, 'ORDER_DIAGNOSTIC', 'CareDiagnosticOrder', order._id, `Ordered ${testName} for patient ${patientId}`);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Lab Order Status & Upload Report (Lab Staff / Facility Admin)
router.put('/:id/status', protect, authorizeRoles('LAB_STAFF', 'FACILITY_ADMIN', 'DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { status, reportUrl, testResultsSummary, performedByStaff } = req.body;
    const order = await DiagnosticOrder.findById(req.params.id)
      .populate('patientId')
      .populate('facilityId')
      .populate('requestingDoctorId');

    if (!order) return res.status(404).json({ message: 'Diagnostic order not found' });

    order.status = status;
    if (status === 'SAMPLE_COLLECTED') order.sampleCollectedAt = new Date();
    if (status === 'COMPLETED' || status === 'REPORT_AVAILABLE') {
      order.completedAt = new Date();
      if (reportUrl) order.reportUrl = reportUrl;
      if (testResultsSummary) order.testResultsSummary = testResultsSummary;
      if (performedByStaff) order.performedByStaff = performedByStaff;
    }
    await order.save();

    if (status === 'COMPLETED' || status === 'REPORT_AVAILABLE') {
      await CareJourneyEvent.create({
        patientId: order.patientId._id,
        eventType: 'DIAGNOSTIC_COMPLETED',
        facilityId: order.facilityId._id,
        facilityName: order.facilityId.name,
        doctorId: order.requestingDoctorId ? order.requestingDoctorId._id : null,
        doctorName: order.requestingDoctorId ? order.requestingDoctorId.fullName : 'Doctor',
        title: `Lab Report Ready: ${order.testName}`,
        description: `Results Summary: ${testResultsSummary || 'Report uploaded'}. Report Link: ${reportUrl || 'Available in portal'}`,
        relatedDiagnosticId: order._id,
      });
    }

    await logAudit(req.user._id, req.user.name, req.user.role, 'UPDATE_DIAGNOSTIC_STATUS', 'CareDiagnosticOrder', order._id, `Status updated to ${status}`);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
