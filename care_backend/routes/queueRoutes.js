const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/Patient');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');
const { emitDomainEvent } = require('../services/realtimeService');

const OPD_DEFAULT_AVERAGES = {
  'General OPD': 7,
  'General Medicine': 7,
  'Cardiology OPD': 12,
  'Pediatrics OPD': 8,
  'Orthopedics OPD': 10,
  'Neurology OPD': 10,
  'Dermatology OPD': 8,
  'ENT OPD': 7
};

// Get active queue for facility + department/doctor
router.get('/', async (req, res) => {
  try {
    const { facilityId, department, doctorId, date } = req.query;
    const mongoose = require('mongoose');
    const todayStr = date || new Date().toISOString().split('T')[0];

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

    if (!queue) {
      queue = await Queue.findOne({})
        .populate('entries.patientId')
        .populate('entries.appointmentId')
        .sort({ updatedAt: -1 });
    }

    if (!queue) {
      if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
        queue = await Queue.create({
          facilityId,
          department: department || 'General Medicine',
          doctorId: (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) ? doctorId : null,
          date: todayStr,
          currentToken: 0,
          servingToken: 1,
          averageConsultationMinutes: OPD_DEFAULT_AVERAGES[department] || 7,
          currentPatientRemainingMinutes: OPD_DEFAULT_AVERAGES[department] || 7,
          currentPatientStartedAt: new Date(),
          entries: [],
        });
      } else {
        return res.json({ servingToken: 1, currentToken: 0, averageConsultationMinutes: 7, currentPatientRemainingMinutes: 7, entries: [] });
      }
    }

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient Check-in -> Issue Queue Token
router.post('/checkin', async (req, res) => {
  try {
    const { appointmentId, facilityId, department, doctorId, patientId, patientName } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    let queue = await Queue.findOne({
      facilityId,
      department: department || 'General Medicine',
      date: todayStr,
    });

    if (!queue) {
      const defaultAvg = OPD_DEFAULT_AVERAGES[department] || 7;
      queue = new Queue({
        facilityId,
        department: department || 'General Medicine',
        doctorId: doctorId || null,
        date: todayStr,
        currentToken: 0,
        servingToken: 1,
        averageConsultationMinutes: defaultAvg,
        currentPatientRemainingMinutes: defaultAvg,
        currentPatientStartedAt: new Date(),
        entries: [],
      });
    }

    const nextToken = queue.currentToken + 1;
    queue.currentToken = nextToken;

    const waitingCount = queue.entries.filter(e => e.status === 'WAITING').length;
    const genAvg = queue.averageConsultationMinutes || OPD_DEFAULT_AVERAGES[department] || 7;
    const currentRem = queue.currentPatientRemainingMinutes ?? genAvg;
    const estimatedWait = Math.round(currentRem + (waitingCount * genAvg));

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
        estimatedWaitMinutes: estimatedWait
      }
    });

    res.json({
      message: 'Patient checked in successfully',
      tokenNumber: nextToken,
      servingToken: queue.servingToken,
      estimatedWaitMinutes: estimatedWait,
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Configure General OPD Consultation Time
router.post('/config', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { queueId, facilityId, department, averageConsultationMinutes, useRollingAverage } = req.body;
    const parsedAvg = parseInt(averageConsultationMinutes);
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
        useRollingAverage: !!useRollingAverage
      }
    });

    res.json({
      message: `General consultation average set to ${parsedAvg} mins`,
      averageConsultationMinutes: parsedAvg,
      queue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor/Staff controls: Advance Queue / Update Estimate
router.post('/action', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { queueId, action, tokenNumber, remainingMinutes } = req.body; // action: 'NEXT', 'START_CONSULT', 'COMPLETE', 'SKIP', 'UPDATE_ESTIMATE'
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    const generalAvg = queue.averageConsultationMinutes || OPD_DEFAULT_AVERAGES[queue.department] || 7;

    if (action === 'UPDATE_ESTIMATE') {
      const parsedRemaining = parseInt(remainingMinutes);
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
          averageConsultationMinutes: generalAvg
        }
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
        queue.currentPatientRemainingMinutes = generalAvg; // Reset to configured general average

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
        doctorId: req.user?._id?.toString()
      });
      queue.recentConsultations = queue.recentConsultations.slice(-20);

      // Auto move to next waiting token if available
      const waiting = queue.entries.find(e => e.status === 'WAITING');
      if (waiting) {
        waiting.status = 'IN_CONSULTATION';
        waiting.startTime = new Date();
        queue.servingToken = waiting.tokenNumber;
        queue.currentPatientStartedAt = new Date();
        queue.currentPatientRemainingMinutes = generalAvg; // Reset to configured general average
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
        averageConsultationMinutes: generalAvg
      }
    });

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

