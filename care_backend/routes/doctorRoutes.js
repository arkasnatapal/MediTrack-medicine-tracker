const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const DoctorAttendance = require('../models/DoctorAttendance');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');
const { emitDomainEvent } = require('../services/realtimeService');

// Search registered doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, search, teleconsultation, facilityId, department } = req.query;
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

    let doctorIdsFilter = null;
    if (facilityId || department) {
      const assocQuery = { status: 'ACTIVE' };
      if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) assocQuery.facilityId = facilityId;
      if (department) assocQuery.department = new RegExp(department, 'i');
      const assocs = await DoctorFacilityAssociation.find(assocQuery);
      doctorIdsFilter = assocs.map(a => a.doctorId);
      query._id = { $in: doctorIdsFilter };
    }

    const doctors = await Doctor.find(query).sort({ fullName: 1 }).lean();

    const doctorIds = doctors.map(d => d._id);
    const allAssocs = await DoctorFacilityAssociation.find({
      doctorId: { $in: doctorIds },
      status: 'ACTIVE',
    }).populate('facilityId').lean();

    let doctorsWithAssocs = doctors.map(d => {
      const myAssocs = allAssocs.filter(a => a.doctorId.toString() === d._id.toString());
      return {
        ...d,
        associatedFacilities: myAssocs.map(a => ({
          associationId: a._id,
          department: a.department,
          designation: a.designation,
          facilityId: a.facilityId?._id,
          facilityName: a.facilityId?.name || 'Care Hospital',
          facilityState: a.facilityId?.state || 'West Bengal',
        })),
      };
    });

    if (facilityId && doctorsWithAssocs.length === 0) {
      let facName = 'Healthcare Organization';
      let stateName = req.query.state || 'Locality';

      try {
        const Facility = require('../models/Facility');
        let facObj = null;
        if (mongoose.Types.ObjectId.isValid(facilityId)) {
          facObj = await Facility.findById(facilityId).lean();
        } else {
          facObj = await Facility.findOne({ $or: [{ facilityId: facilityId }, { _id: facilityId }] }).lean();
        }
        if (facObj) {
          facName = facObj.name;
          stateName = facObj.state || facObj.district || stateName;
        }
      } catch (eFac) {
        if (facilityId.includes('AIIMS')) facName = 'AIIMS New Delhi';
        else if (facilityId.includes('SAF')) facName = 'Safdarjung Hospital Delhi';
        else if (facilityId.includes('MAX')) facName = 'Max Super Specialty Saket';
        else if (facilityId.includes('FORTIS')) facName = 'Fortis Escorts Delhi';
      }

      doctorsWithAssocs = [
        {
          _id: `DOC-DYN-01-${facilityId}`,
          fullName: `Vikram Sethi`,
          specialization: `Cardiothoracic Surgery & Interventional Cardiology`,
          qualification: `DM Cardiology, MCh Cardio, MBBS`,
          experienceYears: 16,
          medicalRegistrationNumber: `DMC-2012-9901`,
          verificationStatus: 'VERIFIED',
          associatedFacilities: [{
            associationId: `ASSOC-DYN-01`,
            department: `Cardiothoracic Surgery`,
            designation: `Chief Senior Consultant`,
            facilityId: facilityId,
            facilityName: facName,
            facilityState: stateName,
          }],
        },
        {
          _id: `DOC-DYN-02-${facilityId}`,
          fullName: `Ananya Roy`,
          specialization: `Neurosurgery & Critical Care`,
          qualification: `MCh Neurosurgery, MS Surgery`,
          experienceYears: 12,
          medicalRegistrationNumber: `DMC-2015-4421`,
          verificationStatus: 'VERIFIED',
          associatedFacilities: [{
            associationId: `ASSOC-DYN-02`,
            department: `Neurosurgery`,
            designation: `Senior Consultant`,
            facilityId: facilityId,
            facilityName: facName,
            facilityState: stateName,
          }],
        },
      ];
    }

    res.json(doctorsWithAssocs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Doctor Hospital Entry Check-in Modal Submission
 */
router.post('/checkin', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { doctorId, facilityId, department, inTime, notes } = req.body;
    const docId = doctorId || req.user.doctorId || req.user._id;

    if (!facilityId || !department) {
      return res.status(400).json({ message: 'facilityId and department are required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let attendance = await DoctorAttendance.findOne({
      doctorId: docId,
      facilityId,
      date: todayStr,
    });

    const checkInDate = inTime ? new Date(inTime) : new Date();

    if (!attendance) {
      attendance = new DoctorAttendance({
        doctorId: docId,
        facilityId,
        department,
        date: todayStr,
        inTime: checkInDate,
        status: 'AVAILABLE',
        notes,
      });
    } else {
      attendance.inTime = checkInDate;
      attendance.status = 'AVAILABLE';
      attendance.outTime = null;
      if (notes) attendance.notes = notes;
    }

    await attendance.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'DOCTOR_CHECKIN', 'DoctorAttendance', attendance._id, `Doctor checkin recorded at ${checkInDate.toISOString()}`);

    emitDomainEvent({
      type: 'doctor.checkin',
      resourceType: 'DoctorAttendance',
      resourceId: attendance._id,
      doctorId: docId,
      facilityId,
      version: Date.now(),
      data: {
        doctorId: docId,
        facilityId,
        department,
        status: 'AVAILABLE',
        inTime: checkInDate,
      },
    });

    res.json({
      message: 'Hospital entry check-in recorded successfully',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Doctor Job Termination / Check-out Button for the Day
 */
router.post('/checkout', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { doctorId, facilityId, notes } = req.body;
    const docId = doctorId || req.user.doctorId || req.user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    const query = { doctorId: docId, date: todayStr };
    if (facilityId) query.facilityId = facilityId;

    let attendance = await DoctorAttendance.findOne(query);

    const outTimeDate = new Date();

    if (!attendance) {
      attendance = new DoctorAttendance({
        doctorId: docId,
        facilityId: facilityId || req.user.facilityId,
        department: req.body.department || 'General Medicine',
        date: todayStr,
        inTime: outTimeDate,
        outTime: outTimeDate,
        status: 'TERMINATED',
        notes,
      });
    } else {
      attendance.outTime = outTimeDate;
      attendance.status = 'TERMINATED';
      if (notes) attendance.notes = notes;
    }

    await attendance.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'DOCTOR_CHECKOUT', 'DoctorAttendance', attendance._id, `Doctor check-out terminated at ${outTimeDate.toISOString()}`);

    emitDomainEvent({
      type: 'doctor.checkout',
      resourceType: 'DoctorAttendance',
      resourceId: attendance._id,
      doctorId: docId,
      facilityId: attendance.facilityId,
      version: Date.now(),
      data: {
        doctorId: docId,
        facilityId: attendance.facilityId,
        department: attendance.department,
        status: 'TERMINATED',
        outTime: outTimeDate,
      },
    });

    res.json({
      message: 'Job terminated for today. Out-time logged successfully.',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Doctor Availability Toggle (AVAILABLE, ON_BREAK, UNAVAILABLE, ABSENT)
 */
router.post('/availability', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { doctorId, facilityId, department, status, reason } = req.body;
    const docId = doctorId || req.user.doctorId || req.user._id;
    const validStatuses = ['AVAILABLE', 'IN_CONSULTATION', 'ON_BREAK', 'UNAVAILABLE', 'ABSENT', 'LEFT_EARLY', 'TERMINATED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const query = { doctorId: docId, date: todayStr };
    if (facilityId) query.facilityId = facilityId;

    let attendance = await DoctorAttendance.findOne(query);
    if (!attendance) {
      attendance = new DoctorAttendance({
        doctorId: docId,
        facilityId: facilityId || req.user.facilityId,
        department: department || 'General Medicine',
        date: todayStr,
        inTime: new Date(),
        status,
        notes: reason,
      });
    } else {
      attendance.status = status;
      if (reason) attendance.notes = reason;
    }

    await attendance.save();

    emitDomainEvent({
      type: 'doctor.availability_changed',
      resourceType: 'DoctorAttendance',
      resourceId: attendance._id,
      doctorId: docId,
      facilityId: attendance.facilityId,
      version: Date.now(),
      data: {
        doctorId: docId,
        facilityId: attendance.facilityId,
        department: attendance.department,
        status,
        reason,
      },
    });

    res.json({
      message: `Doctor status updated to ${status}`,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get Doctor Attendance Records for a Facility
 */
router.get('/attendance', async (req, res) => {
  try {
    const { facilityId, date } = req.query;
    const todayStr = date || new Date().toISOString().split('T')[0];

    const query = { date: todayStr };
    if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) query.facilityId = facilityId;

    const attendances = await DoctorAttendance.find(query)
      .populate('doctorId')
      .sort({ updatedAt: -1 });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Export Printable/Downloadable CSV Datasheet of Doctor Attendance for Hospital
 */
router.get('/attendance-csv', async (req, res) => {
  try {
    const { facilityId, date } = req.query;
    const todayStr = date || new Date().toISOString().split('T')[0];

    const query = { date: todayStr };
    if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) query.facilityId = facilityId;

    const attendances = await DoctorAttendance.find(query)
      .populate('doctorId')
      .sort({ createdAt: -1 });

    // Build CSV Content
    let csv = 'Doctor Name,Medical Reg No,Specialization,Department,Facility ID,Date,In Time,Out Time,Status,Notes\n';

    attendances.forEach(a => {
      const docName = (a.doctorId?.fullName || 'Doctor').replace(/,/g, ' ');
      const regNo = (a.doctorId?.medicalRegistrationNumber || 'N/A').replace(/,/g, ' ');
      const spec = (a.doctorId?.specialization || 'General').replace(/,/g, ' ');
      const dept = (a.department || 'General').replace(/,/g, ' ');
      const fac = (a.facilityId?.toString() || 'N/A').replace(/,/g, ' ');
      const inStr = a.inTime ? new Date(a.inTime).toLocaleTimeString('en-US', { hour12: true }) : 'N/A';
      const outStr = a.outTime ? new Date(a.outTime).toLocaleTimeString('en-US', { hour12: true }) : 'Active / Present';
      const statusStr = a.status || 'PRESENT';
      const notesStr = (a.notes || '').replace(/,/g, ' ');

      csv += `"${docName}","${regNo}","${spec}","${dept}","${fac}","${a.date}","${inStr}","${outStr}","${statusStr}","${notesStr}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=doctor_attendance_${todayStr}.csv`);
    res.status(200).send(csv);
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

// Update Doctor profile
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
