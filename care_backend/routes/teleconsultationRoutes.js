const express = require('express');
const router = express.Router();
const TeleconsultationSession = require('../models/TeleconsultationSession');
const CareAppointment = require('../models/Appointment');
const Message = require('../models/Message');
const CareJourneyEvent = require('../models/CareJourneyEvent');
const Doctor = require('../models/Doctor');
const { sendTeleconsultationEmail } = require('../services/emailService');
const { protect, authorizeRoles, logAudit } = require('../middleware/authMiddleware');

// Get all teleconsultation sessions
router.get('/', async (req, res) => {
  try {
    const { facilityId, doctorId, status } = req.query;
    const mongoose = require('mongoose');
    const query = {};

    if (status) query.status = status;

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.$or = [{ doctorId: new mongoose.Types.ObjectId(doctorId) }, { doctorId: doctorId.toString() }];
    } else if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
      query.facilityId = facilityId;
    }

    let sessions = await TeleconsultationSession.find(query).sort({ createdAt: -1 });

    // Fallback: If filtering produced no results, return all sessions sorted by date
    if (sessions.length === 0 && !doctorId) {
      sessions = await TeleconsultationSession.find(status ? { status } : {}).sort({ createdAt: -1 });
    }

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor Claims / Accepts Pending Teleconsultation Session
router.put('/:id/claim', protect, authorizeRoles('DOCTOR', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const doctorObj = await Doctor.findById(req.user.doctorId);
    const doctorName = doctorObj ? doctorObj.fullName : req.user.name;

    session.doctorId = req.user.doctorId;
    session.doctorName = doctorName;
    session.scheduledTime = session.scheduledTime || 'Now (On-Demand)';
    session.status = 'CONFIRMED';
    const meetingLink = `http://localhost:5173/care-network/teleconsultation?meetingId=${session.meetingIdentifier}`;
    session.meetingLink = meetingLink;

    await session.save();

    if (session.patientEmail) {
      await sendTeleconsultationEmail({
        to: session.patientEmail,
        patientName: session.patientName,
        hospitalName: session.facilityName,
        doctorName: session.doctorName,
        specialty: session.specialty,
        scheduledTime: session.scheduledTime,
        meetingLink,
      });
    }

    res.json({ message: 'Teleconsultation claimed successfully!', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Re-send Email Notification to Patient
router.post('/:id/resend-email', async (req, res) => {
  try {
    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const recipientEmail = req.body.patientEmail || session.patientEmail;
    if (!recipientEmail) {
      return res.status(400).json({ message: 'No patient email provided or found for this session.' });
    }

    const meetingLink = session.meetingLink || `http://localhost:5173/care-network/teleconsultation?meetingId=${session.meetingIdentifier}`;
    
    const emailRes = await sendTeleconsultationEmail({
      to: recipientEmail,
      patientName: session.patientName,
      hospitalName: session.facilityName,
      doctorName: session.doctorName || 'Specialist Officer',
      specialty: session.specialty,
      scheduledTime: session.scheduledTime || 'Scheduled Session',
      meetingLink,
    });

    res.json({ message: `Email notification sent successfully to ${recipientEmail}`, emailRes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient Requests Consultation (PENDING state awaiting hospital doctor allocation)
router.post('/request', async (req, res) => {
  try {
    const { patientName, patientPhone, patientEmail, facilityId, facilityName, specialty, symptoms } = req.body;

    if (!facilityId || !specialty || !symptoms) {
      return res.status(400).json({ message: 'Facility ID, specialty, and symptoms are required' });
    }

    const meetingId = `MEET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const roomId = `room-${meetingId}`;

    const session = await TeleconsultationSession.create({
      patientName: patientName || 'Patient',
      patientPhone: patientPhone || '',
      patientEmail: patientEmail || '',
      facilityId,
      facilityName: facilityName || 'District Healthcare Center',
      specialty,
      symptoms,
      meetingIdentifier: meetingId,
      socketRoomId: roomId,
      status: 'PENDING',
      postSessionMessagesLeft: 10,
      postSessionMessagesSent: 0,
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hospital Staff / Admin Assigns Doctor & Schedules Time (PENDING -> CONFIRMED)
router.put('/:id/assign', async (req, res) => {
  try {
    const { doctorId, doctorName, scheduledTime } = req.body;
    const mongoose = require('mongoose');

    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      session.doctorId = new mongoose.Types.ObjectId(doctorId);
    } else {
      session.doctorId = doctorId || null;
    }

    session.doctorName = doctorName || 'Specialist Officer';
    session.scheduledTime = scheduledTime || 'Today at 4:00 PM';
    session.status = 'CONFIRMED';

    const meetingLink = `http://localhost:5173/care-network/teleconsultation?meetingId=${session.meetingIdentifier}`;
    session.meetingLink = meetingLink;

    await session.save();

    // Trigger Email Notification with Join Link
    if (session.patientEmail) {
      await sendTeleconsultationEmail({
        to: session.patientEmail,
        patientName: session.patientName,
        hospitalName: session.facilityName,
        doctorName: session.doctorName,
        specialty: session.specialty,
        scheduledTime: session.scheduledTime,
        meetingLink,
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Live Consultation Session (CONFIRMED -> ACTIVE)
router.put('/:id/start', async (req, res) => {
  try {
    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'ACTIVE';
    session.startTime = session.startTime || new Date();
    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DOCTOR / PATIENT TERMINATES SESSION -> Enables 10 Post-Session Follow-Up Messages
router.put('/:id/terminate', async (req, res) => {
  try {
    const { by } = req.body;

    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'TERMINATED';
    session.endTime = new Date();
    session.terminatedAt = new Date();
    session.terminatedBy = by || 'DOCTOR';
    await session.save();

    res.json({
      message: 'Teleconsultation session terminated. Live video/audio ended. Patient allocated 10 post-session follow-up messages.',
      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DOCTOR CLEARS & STOPS CONSULTATION -> Marks CLOSED and sets 3-Day MongoDB TTL auto-purge
router.put('/:id/close', async (req, res) => {
  try {
    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const closedDate = new Date();
    const purgeDate = new Date(closedDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days in ms

    session.status = 'CLOSED';
    session.closedAt = closedDate;
    session.expiresAt = purgeDate;
    await session.save();

    res.json({
      message: 'Consultation officially closed and cleared. Auto-archive scheduled in 3 days.',
      session,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post-Session Follow-Up Message (Patient sends text or voice clip after session is terminated)
router.post(['/:id/post-message', '/:id/post-session-message'], async (req, res) => {
  try {
    const { sender, text, voiceClipUrl } = req.body;

    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status !== 'TERMINATED' && session.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Post-session messages are active after the session terminates.' });
    }

    if (session.postSessionMessagesLeft <= 0) {
      return res.status(403).json({
        message: 'Post-session message quota (10 messages) has been exhausted for this session.',
      });
    }

    const newMessage = {
      sender: sender || 'PATIENT',
      text: text || '',
      voiceClipUrl: voiceClipUrl || '',
      timestamp: new Date(),
    };

    session.postSessionMessages.push(newMessage);
    session.postSessionMessagesLeft -= 1;
    session.postSessionMessagesSent += 1;

    await session.save();

    res.status(201).json({
      message: 'Post-session message sent to doctor.',
      session,
      newMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// In-Session Live Text Chat
router.post('/:id/in-session-chat', async (req, res) => {
  try {
    const { sender, text } = req.body;

    const session = await TeleconsultationSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'In-session chat is active only during an ACTIVE call session.' });
    }

    const chatItem = {
      sender: sender || 'User',
      text,
      timestamp: new Date(),
    };

    session.inSessionChat.push(chatItem);
    await session.save();

    res.json(session.inSessionChat);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get session details by ID or MeetingIdentifier
router.get('/:id', async (req, res) => {
  try {
    let session = null;
    if (req.params.id.startsWith('MEET-')) {
      session = await TeleconsultationSession.findOne({ meetingIdentifier: req.params.id });
    } else {
      session = await TeleconsultationSession.findById(req.params.id);
    }

    if (!session) return res.status(404).json({ message: 'Session not found' });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete teleconsultation session from DB
router.delete('/:id', async (req, res) => {
  try {
    let session = null;
    if (req.params.id.startsWith('MEET-')) {
      session = await TeleconsultationSession.findOneAndDelete({ meetingIdentifier: req.params.id });
    } else {
      session = await TeleconsultationSession.findByIdAndDelete(req.params.id);
    }

    if (!session) {
      return res.status(404).json({ message: 'Teleconsultation session not found' });
    }

    res.json({ success: true, message: 'Teleconsultation session deleted successfully from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
