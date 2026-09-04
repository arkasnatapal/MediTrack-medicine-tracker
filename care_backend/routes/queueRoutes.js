const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const PatientRecord = require('../models/Patient');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

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
          entries: [],
        });
      } else {
        return res.json({ servingToken: 1, currentToken: 0, entries: [] });
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
      queue = new Queue({
        facilityId,
        department: department || 'General Medicine',
        doctorId: doctorId || null,
        date: todayStr,
        currentToken: 0,
        servingToken: 1,
        entries: [],
      });
    }

    const nextToken = queue.currentToken + 1;
    queue.currentToken = nextToken;

    const waitingCount = queue.entries.filter(e => e.status === 'WAITING').length;
    const estimatedWait = waitingCount * 12;

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

// Doctor/Staff controls: Advance Queue (NEXT PATIENT / START / COMPLETE)
router.post('/action', protect, authorizeRoles('DOCTOR', 'FACILITY_STAFF', 'FACILITY_ADMIN'), async (req, res) => {
  try {
    const { queueId, action, tokenNumber } = req.body; // action: 'NEXT', 'START_CONSULT', 'COMPLETE', 'SKIP'
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: 'Queue not found' });

    if (action === 'NEXT') {
      const nextEntry = queue.entries.find(e => e.status === 'WAITING');
      if (nextEntry) {
        nextEntry.status = 'IN_CONSULTATION';
        nextEntry.startTime = new Date();
        queue.servingToken = nextEntry.tokenNumber;

        if (nextEntry.appointmentId) {
          await Appointment.findByIdAndUpdate(nextEntry.appointmentId, { status: 'IN_CONSULTATION' });
        }
      }
    } else if (action === 'COMPLETE') {
      const currentEntry = queue.entries.find(e => e.tokenNumber === (tokenNumber || queue.servingToken));
      if (currentEntry) {
        currentEntry.status = 'COMPLETED';
        currentEntry.endTime = new Date();

        if (currentEntry.appointmentId) {
          await Appointment.findByIdAndUpdate(currentEntry.appointmentId, { status: 'COMPLETED' });
        }
      }
      // Auto move to next waiting token if available
      const waiting = queue.entries.find(e => e.status === 'WAITING');
      if (waiting) {
        waiting.status = 'IN_CONSULTATION';
        waiting.startTime = new Date();
        queue.servingToken = waiting.tokenNumber;
      } else {
        queue.servingToken = 0;
      }
    } else if (action === 'SKIP') {
      const entry = queue.entries.find(e => e.tokenNumber === tokenNumber);
      if (entry) entry.status = 'SKIPPED';
    }

    await queue.save();

    await logAudit(req.user._id, req.user.name, req.user.role, 'QUEUE_ACTION', 'CareQueue', queue._id, `Queue action: ${action}`);

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
