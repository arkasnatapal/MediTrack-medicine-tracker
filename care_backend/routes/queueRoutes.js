const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const OpdSchedule = require('../models/OpdSchedule');
const DoctorAttendance = require('../models/DoctorAttendance');
const Doctor = require('../models/Doctor');
const Facility = require('../models/Facility');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');
const { emitDomainEvent } = require('../services/realtimeService');
const { evaluateOpdStatus, calculateWaitTime, getFacilityTime } = require('../services/opdScheduleEngine');

const OPD_DEFAULT_AVERAGES = {
  'General OPD': 7,
  'General Medicine': 7,
  'Cardiology OPD': 12,
  'Pediatrics OPD': 8,
  'Orthopedics OPD': 10,
  'Neurology OPD': 10,
  'Dermatology OPD': 8,
  'ENT OPD': 7,
};

async function resolveFacilityId(facilityIdInput, reqUser = null) {
  let raw = facilityIdInput;
  if (!raw && reqUser) {
    raw = reqUser.facilityId || reqUser.facility;
  }
  if (!raw) return null;

  if (typeof raw === 'object' && raw !== null) {
    raw = raw._id || raw.id || raw.facilityId;
  }
  if (!raw) return null;

  const str = String(raw).trim();
  if (mongoose.Types.ObjectId.isValid(str)) {
    return new mongoose.Types.ObjectId(str);
  }

  try {
    const fac = await Facility.findOne({
      $or: [
        { licenseId: str },
        { facilityId: str },
        { name: new RegExp(str, 'i') }
      ]
    });
    if (fac) return fac._id;
  } catch (e) {}

  return null;
}

/**
 * Get active queue for facility + department/doctor with calculated OPD status & dynamic wait
 */
router.get('/', async (req, res) => {
  try {
    const { facilityId: rawFacilityId, department, doctorId, date } = req.query;
    const todayStr = date || new Date().toISOString().split('T')[0];

    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;

    const query = {};
    if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
      query.facilityId = facilityId;
    }
    if (department) query.department = department;
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) query.doctorId = doctorId;

    let queue = await Queue.findOne(query)
      .populate('entries.patientId')
      .populate('entries.appointmentId')
      .sort({ updatedAt: -1 });

    if (!queue && department) {
      queue = await Queue.findOne({ department })
        .populate('entries.patientId')
        .populate('entries.appointmentId')
        .sort({ updatedAt: -1 });
    }

    if (!queue && facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
      queue = await Queue.create({
        facilityId,
        department: department || 'General Medicine',
        doctorId: doctorId && mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null,
        date: todayStr,
        currentToken: 0,
        servingToken: 1,
        averageConsultationMinutes: OPD_DEFAULT_AVERAGES[department] || 7,
        currentPatientRemainingMinutes: OPD_DEFAULT_AVERAGES[department] || 7,
        currentPatientStartedAt: new Date(),
        entries: [],
      });
    }

    if (!queue) {
      return res.json({
        servingToken: 1,
        currentToken: 0,
        averageConsultationMinutes: 7,
        currentPatientRemainingMinutes: 7,
        entries: [],
        opdStatusObj: { opdStatus: 'OPEN', registrationOpen: true, queueActive: true },
        waitEstimate: { estimatedWaitMinutes: 0, displayText: '~0 mins' },
      });
    }

    // Fetch OPD Schedule & evaluate authoritative OPD status
    let opdSchedule = null;
    if (queue.facilityId) {
      opdSchedule = await OpdSchedule.findOne({
        facilityId: queue.facilityId,
        department: queue.department || department || 'General Medicine',
      });
    }

    const opdStatusObj = evaluateOpdStatus(opdSchedule, queue.manualOverrideStatus, new Date());
    queue.opdStatus = opdStatusObj.opdStatus;

    // Check active doctors in department today
    let activeDoctorsCount = 1;
    let doctorStatus = 'AVAILABLE';

    if (queue.facilityId) {
      const activeAttendances = await DoctorAttendance.find({
        facilityId: queue.facilityId,
        department: queue.department,
        date: todayStr,
        status: { $in: ['PRESENT', 'AVAILABLE', 'IN_CONSULTATION'] },
      });
      activeDoctorsCount = activeAttendances.length;

      if (queue.doctorId) {
        const docAtt = await DoctorAttendance.findOne({
          doctorId: queue.doctorId,
          facilityId: queue.facilityId,
          date: todayStr,
        });
        if (docAtt) {
          doctorStatus = docAtt.status;
        }
      }
    }

    queue.activeDoctorsCount = activeDoctorsCount;

    const waitingCount = queue.entries.filter(e => e.status === 'WAITING').length;

    const waitEstimate = calculateWaitTime({
      opdStatusObj,
      activeDoctorsCount,
      doctorStatus,
      waitingCount,
      averageConsultationMinutes: queue.averageConsultationMinutes || OPD_DEFAULT_AVERAGES[queue.department] || 7,
      currentPatientRemainingMinutes: queue.currentPatientRemainingMinutes ?? 7,
      queueMode: queue.queueMode || opdSchedule?.queueMode || 'SHARED_QUEUE',
    });

    const queueJson = queue.toObject();
    queueJson.opdStatusObj = opdStatusObj;
    queueJson.waitEstimate = waitEstimate;
    queueJson.scheduleConfig = opdSchedule || null;

    res.json(queueJson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Fetch OPD Schedule configuration for facility + department
 */
router.get('/opd-schedule', async (req, res) => {
  try {
    const { facilityId: rawFacilityId, department } = req.query;
    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;

    if (!facilityId || !department) {
      return res.status(400).json({ message: 'facilityId and department required' });
    }

    let schedule = await OpdSchedule.findOne({ facilityId, department });
    if (!schedule) {
      schedule = await OpdSchedule.create({
        facilityId,
        department,
        openTime: '09:00',
        closeTime: '13:00',
        breakStart: '11:30',
        breakEnd: '12:00',
        lastTokenTime: '12:30',
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ facilityId, department, date: todayStr });
    const manualOverride = queue ? queue.manualOverrideStatus : 'NONE';

    const opdStatusObj = evaluateOpdStatus(schedule, manualOverride, new Date());
    res.json({ schedule, opdStatusObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Configure OPD Schedule for facility + department
 */
router.post('/opd-schedule', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    let {
      facilityId: rawFacilityId,
      department,
      timezone,
      operatingDays,
      openTime,
      closeTime,
      breakStart,
      breakEnd,
      lastTokenTime,
      closingWarningMinutes,
      queueMode,
      closingPolicy,
      holidays,
      specialDateOverrides,
    } = req.body;

    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;

    if (!facilityId || !department) {
      return res.status(400).json({ message: 'facilityId and department are required' });
    }

    let schedule = await OpdSchedule.findOne({ facilityId, department });
    if (!schedule) {
      schedule = new OpdSchedule({ facilityId, department });
    }

    if (timezone) schedule.timezone = timezone;
    if (operatingDays) schedule.operatingDays = operatingDays;
    if (openTime) schedule.openTime = openTime;
    if (closeTime) schedule.closeTime = closeTime;
    if (breakStart !== undefined) schedule.breakStart = breakStart;
    if (breakEnd !== undefined) schedule.breakEnd = breakEnd;
    if (lastTokenTime !== undefined) schedule.lastTokenTime = lastTokenTime;
    if (closingWarningMinutes !== undefined) schedule.closingWarningMinutes = closingWarningMinutes;
    if (queueMode) schedule.queueMode = queueMode;
    if (closingPolicy) schedule.closingPolicy = closingPolicy;
    if (holidays) schedule.holidays = holidays;
    if (specialDateOverrides) schedule.specialDateOverrides = specialDateOverrides;

    await schedule.save();

    const todayStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ facilityId, department, date: todayStr });
    const manualOverride = queue ? queue.manualOverrideStatus : 'NONE';

    const opdStatusObj = evaluateOpdStatus(schedule, manualOverride, new Date());

    if (queue) {
      queue.opdStatus = opdStatusObj.opdStatus;
      queue.queueMode = schedule.queueMode;
      queue.timezone = schedule.timezone;
      await queue.save();
    }

    emitDomainEvent({
      type: 'opd.status_changed',
      resourceType: 'OpdSchedule',
      resourceId: schedule._id,
      facilityId,
      version: Date.now(),
      data: {
        facilityId,
        department,
        opdStatus: opdStatusObj.opdStatus,
        reason: opdStatusObj.reason,
        schedule,
      },
    });

    res.json({
      message: 'OPD Schedule updated successfully',
      schedule,
      opdStatusObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Facility Staff/Admin manual OPD state controls (Open, Pause, Resume, Close, Close Registration)
 */
router.post('/opd-status', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    let { facilityId: rawFacilityId, department, action } = req.body;
    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;

    if (!facilityId || !department || !action) {
      return res.status(400).json({ message: 'facilityId, department, and action are required' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let queue = await Queue.findOne({ facilityId, department, date: todayStr });
    if (!queue) {
      queue = await Queue.create({
        facilityId,
        department,
        date: todayStr,
        currentToken: 0,
        servingToken: 1,
      });
    }

    let override = 'NONE';
    let eventType = 'opd.status_changed';

    if (action === 'PAUSE') {
      override = 'PAUSED';
      queue.isPaused = true;
      eventType = 'opd.paused';
    } else if (action === 'OPEN') {
      override = 'OPEN';
      queue.isPaused = false;
      eventType = 'opd.opened';
    } else if (action === 'CLOSE_REGISTRATION') {
      override = 'REGISTRATION_CLOSED';
      queue.isPaused = false;
      eventType = 'opd.registration_closed';
    } else if (action === 'CLOSE') {
      override = 'CLOSED';
      queue.isPaused = false;
      eventType = 'opd.closed';
    } else if (action === 'RESUME' || action === 'AUTO' || action === 'RESET') {
      override = 'NONE';
      queue.isPaused = false;
      eventType = 'opd.resumed';
    }

    queue.manualOverrideStatus = override;
    await queue.save();

    const schedule = await OpdSchedule.findOne({ facilityId, department });
    const opdStatusObj = evaluateOpdStatus(schedule, override, new Date());
    queue.opdStatus = opdStatusObj.opdStatus;
    await queue.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'OPD_STATUS_OVERRIDE', 'CareQueue', queue._id, `Manual action: ${action}`);

    emitDomainEvent({
      type: eventType,
      resourceType: 'Queue',
      resourceId: queue._id,
      facilityId,
      version: Date.now(),
      data: {
        facilityId,
        department,
        opdStatus: opdStatusObj.opdStatus,
        action,
        reason: opdStatusObj.reason,
      },
    });

    res.json({
      message: `OPD status updated to ${opdStatusObj.opdStatus}`,
      queue,
      opdStatusObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Patient Check-in -> Issue Queue Token (Blocked if registration is closed/OPD inactive)
 */
router.post('/checkin', async (req, res) => {
  try {
    const { appointmentId, facilityId: rawFacilityId, department, doctorId, patientId, patientName } = req.body;
    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;
    const todayStr = new Date().toISOString().split('T')[0];

    const targetDept = department || 'General Medicine';

    // Authoritative OPD Operational Status Check
    const schedule = await OpdSchedule.findOne({ facilityId, department: targetDept });
    let queue = await Queue.findOne({ facilityId, department: targetDept, date: todayStr });

    const manualOverride = queue ? queue.manualOverrideStatus : 'NONE';
    const opdStatusObj = evaluateOpdStatus(schedule, manualOverride, new Date());

    if (!opdStatusObj.registrationOpen) {
      let errMsg = 'Token registration is closed for today.';
      if (opdStatusObj.opdStatus === 'CLOSED') errMsg = 'OPD is currently closed.';
      if (opdStatusObj.opdStatus === 'HOLIDAY') errMsg = 'OPD is closed for holiday.';
      if (opdStatusObj.opdStatus === 'SCHEDULED') errMsg = `OPD opens at ${opdStatusObj.nextAvailableTime || 'scheduled time'}.`;
      if (opdStatusObj.opdStatus === 'BREAK') errMsg = `OPD is on break until ${opdStatusObj.nextAvailableTime || 'break end'}.`;
      if (opdStatusObj.opdStatus === 'PAUSED') errMsg = 'Queue is temporarily paused by facility.';

      return res.status(400).json({
        success: false,
        message: errMsg,
        opdStatus: opdStatusObj.opdStatus,
        reason: opdStatusObj.reason,
      });
    }

    // Doctor-Specific Queue Availability Check
    const queueMode = schedule?.queueMode || queue?.queueMode || 'SHARED_QUEUE';
    if (queueMode === 'DOCTOR_SPECIFIC_QUEUE' && doctorId) {
      const docAtt = await DoctorAttendance.findOne({
        doctorId,
        facilityId,
        date: todayStr,
      });
      if (docAtt && ['UNAVAILABLE', 'ABSENT', 'LEFT_EARLY'].includes(docAtt.status)) {
        return res.status(400).json({
          success: false,
          message: `Assigned doctor is currently ${docAtt.status.toLowerCase().replace('_', ' ')}. Token registration paused.`,
          opdStatus: 'DOCTOR_UNAVAILABLE',
        });
      }
    }

    if (!queue) {
      const defaultAvg = OPD_DEFAULT_AVERAGES[targetDept] || 7;
      queue = new Queue({
        facilityId,
        department: targetDept,
        doctorId: doctorId || null,
        date: todayStr,
        currentToken: 0,
        servingToken: 1,
        averageConsultationMinutes: defaultAvg,
        currentPatientRemainingMinutes: defaultAvg,
        currentPatientStartedAt: new Date(),
        entries: [],
        queueMode,
      });
    }

    const nextToken = queue.currentToken + 1;
    queue.currentToken = nextToken;

    const waitingCount = queue.entries.filter(e => e.status === 'WAITING').length;
    const genAvg = queue.averageConsultationMinutes || OPD_DEFAULT_AVERAGES[targetDept] || 7;

    const activeAttendances = await DoctorAttendance.find({
      facilityId,
      department: targetDept,
      date: todayStr,
      status: { $in: ['PRESENT', 'AVAILABLE', 'IN_CONSULTATION'] },
    });
    const activeDoctorsCount = Math.max(1, activeAttendances.length);

    const waitEstObj = calculateWaitTime({
      opdStatusObj,
      activeDoctorsCount,
      waitingCount,
      averageConsultationMinutes: genAvg,
      currentPatientRemainingMinutes: queue.currentPatientRemainingMinutes ?? genAvg,
      queueMode,
    });

    const estimatedWait = waitEstObj.estimatedWaitMinutes || 15;

    const queueEntry = {
      tokenNumber: nextToken,
      appointmentId: appointmentId || null,
      patientId,
      patientName: patientName || 'Patient',
      status: 'WAITING',
      checkInTime: new Date(),
      estimatedWaitMinutes: estimatedWait,
    };

    queue.entries.push(queueEntry);
    await queue.save();

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'CHECKED_IN',
        tokenNumber: nextToken,
      });
    }

    emitDomainEvent({
      type: 'queue.updated',
      resourceType: 'Queue',
      resourceId: queue._id,
      facilityId,
      version: Date.now(),
      data: {
        facilityId,
        department: queue.department,
        currentToken: queue.servingToken,
        totalTokensBooked: queue.currentToken,
        estimatedWaitMinutes: estimatedWait,
        opdStatus: opdStatusObj.opdStatus,
      },
    });

    res.json({
      message: 'Patient checked in successfully',
      tokenNumber: nextToken,
      servingToken: queue.servingToken,
      estimatedWaitMinutes: estimatedWait,
      opdStatus: opdStatusObj.opdStatus,
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Configure General OPD Consultation Time
 */
router.post('/config', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { queueId, facilityId: rawFacilityId, department, averageConsultationMinutes, useRollingAverage } = req.body;
    const facilityId = await resolveFacilityId(rawFacilityId, req.user) || rawFacilityId;
    const parsedAvg = parseInt(averageConsultationMinutes, 10);
    if (isNaN(parsedAvg) || parsedAvg <= 0) {
      return res.status(400).json({ message: 'Invalid average consultation minutes' });
    }

    let queue = null;
    if (queueId) queue = await Queue.findById(queueId);
    if (!queue && facilityId && department) {
      queue = await Queue.findOne({ facilityId, department });
    }

    if (queue) {
      queue.averageConsultationMinutes = parsedAvg;
      if (useRollingAverage !== undefined) queue.useRollingAverage = !!useRollingAverage;
      await queue.save();
    }

    emitDomainEvent({
      type: 'queue.updated',
      resourceType: 'Queue',
      resourceId: queue ? queue._id : facilityId,
      facilityId,
      version: Date.now(),
      data: {
        facilityId,
        department,
        averageConsultationMinutes: parsedAvg,
        useRollingAverage: !!useRollingAverage,
      },
    });

    res.json({
      message: `General consultation average set to ${parsedAvg} mins`,
      averageConsultationMinutes: parsedAvg,
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Doctor/Staff controls: Advance Queue / Update Estimate
 */
router.post('/action', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { queueId, action, tokenNumber, remainingMinutes } = req.body;
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    const generalAvg = queue.averageConsultationMinutes || OPD_DEFAULT_AVERAGES[queue.department] || 7;

    if (action === 'UPDATE_ESTIMATE') {
      const parsedRemaining = parseInt(remainingMinutes, 10);
      if (isNaN(parsedRemaining) || parsedRemaining < 0) {
        return res.status(400).json({ message: 'Invalid remaining minutes input' });
      }
      queue.currentPatientRemainingMinutes = parsedRemaining;
      await queue.save();

      emitDomainEvent({
        type: 'queue.consultation_time_updated',
        resourceType: 'Queue',
        resourceId: queue._id,
        facilityId: queue.facilityId,
        version: Date.now(),
        data: {
          facilityId: queue.facilityId,
          department: queue.department,
          currentToken: queue.servingToken,
          currentPatientRemainingMinutes: parsedRemaining,
          averageConsultationMinutes: generalAvg,
        },
      });

      return res.json(queue);
    }

    if (action === 'NEXT') {
      const nextEntry = queue.entries.find(e => e.status === 'WAITING');
      if (nextEntry) {
        nextEntry.status = 'IN_CONSULTATION';
        nextEntry.startTime = new Date();
        queue.servingToken = nextEntry.tokenNumber;
        queue.currentPatientStartedAt = new Date();
        queue.currentPatientRemainingMinutes = generalAvg;

        if (nextEntry.appointmentId) {
          await Appointment.findByIdAndUpdate(nextEntry.appointmentId, { status: 'IN_CONSULTATION' });
        }
      }
    } else if (action === 'COMPLETE') {
      const currentEntry = queue.entries.find(e => e.tokenNumber === (tokenNumber || queue.servingToken));
      let durationMinutes = generalAvg;
      if (queue.currentPatientStartedAt) {
        const elapsedMs = new Date() - new Date(queue.currentPatientStartedAt);
        durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));
      }

      if (currentEntry) {
        currentEntry.status = 'COMPLETED';
        currentEntry.endTime = new Date();
        currentEntry.durationMinutes = durationMinutes;

        if (currentEntry.appointmentId) {
          await Appointment.findByIdAndUpdate(currentEntry.appointmentId, { status: 'COMPLETED' });
        }
      }

      if (!queue.recentConsultations) queue.recentConsultations = [];
      queue.recentConsultations.push({
        durationMinutes,
        completedAt: new Date(),
        doctorId: req.user?._id?.toString(),
      });
      queue.recentConsultations = queue.recentConsultations.slice(-20);

      const waiting = queue.entries.find(e => e.status === 'WAITING');
      if (waiting) {
        waiting.status = 'IN_CONSULTATION';
        waiting.startTime = new Date();
        queue.servingToken = waiting.tokenNumber;
        queue.currentPatientStartedAt = new Date();
        queue.currentPatientRemainingMinutes = generalAvg;
      } else {
        queue.servingToken = 0;
        queue.currentPatientRemainingMinutes = generalAvg;
      }
    } else if (action === 'SKIP') {
      const entry = queue.entries.find(e => e.tokenNumber === tokenNumber);
      if (entry) entry.status = 'SKIPPED';
    }

    await queue.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'QUEUE_ACTION', 'CareQueue', queue._id, `Queue action: ${action}`);

    emitDomainEvent({
      type: action === 'COMPLETE' ? 'queue.consultation_completed' : 'queue.token_called',
      resourceType: 'Queue',
      resourceId: queue._id,
      facilityId: queue.facilityId,
      version: Date.now(),
      data: {
        facilityId: queue.facilityId,
        department: queue.department,
        currentToken: queue.servingToken,
        currentPatientRemainingMinutes: queue.currentPatientRemainingMinutes,
        averageConsultationMinutes: generalAvg,
      },
    });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
