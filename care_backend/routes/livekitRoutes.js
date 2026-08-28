const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const { protect } = require('../middleware/authMiddleware');
const DoctorFacilityAssociation = require('../models/DoctorFacilityAssociation');
const TeleconsultationSession = require('../models/TeleconsultationSession');
const Doctor = require('../models/Doctor');
const Facility = require('../models/Facility');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meditrack_care_network_super_secret_key_2026');
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user && req.user.role === 'DOCTOR' && !req.user.doctorId) {
        const Doctor = require('../models/Doctor');
        const doc = await Doctor.findOne({ userId: req.user._id });
        if (doc) req.user.doctorId = doc._id;
      }
    } catch (e) {
      // invalid token, proceed unauthenticated
    }
  }
  next();
};

/**
 * POST /api/livekit/token
 * Generate authenticated LiveKit token for Video / Voice / Text Communication
 */
router.post('/token', optionalAuth, async (req, res) => {
  try {
    let { roomName, participantName } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: 'roomName is required' });
    }

    const userId = req.user ? req.user._id.toString() : 'guest_patient';
    const userRole = req.user ? req.user.role : 'PATIENT';
    const userName = participantName || (req.user ? req.user.name : 'Patient');

    // Security & Authorization Validation
    let isAuthorized = false;

    // Case 1: Teleconsultation Session Room (telecon_<meetingIdentifier> or telecon:<meetingIdentifier> or MEET-...)
    if (roomName.includes('telecon') || roomName.includes('MEET-')) {
      const cleanId = roomName.replace('telecon:', '').replace('telecon_', '');
      const session = await TeleconsultationSession.findOne({
        $or: [{ meetingIdentifier: cleanId }, { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null }].filter(Boolean),
      });

      if (session) {
        // Authorized if doctor, system admin, facility staff, or patient matching/joining the session
        if (
          !req.user || // Unauthenticated patient joining with valid session meeting ID
          userRole === 'SYSTEM_ADMIN' ||
          userRole === 'PATIENT' ||
          (userRole === 'DOCTOR' && (req.user.doctorId?.toString() === session.doctorId?.toString() || !session.doctorId)) ||
          (['FACILITY_ADMIN', 'FACILITY_STAFF'].includes(userRole) && req.user.facilityId?.toString() === session.facilityId?.toString()) ||
          userId === session.patientId?.toString()
        ) {
          isAuthorized = true;
        }
      } else {
        // Fallback for new/on-demand teleconsultation room creation
        isAuthorized = true;
      }
    }
    // Case 2: Hospital <-> Doctor Communication Room
    else if (roomName.includes('hospital_') || roomName.includes('facility_')) {
      if (req.user) {
        const parts = roomName.split('_');
        let facId = null;
        let docId = null;

        for (let i = 0; i < parts.length; i++) {
          if ((parts[i] === 'hospital' || parts[i] === 'facility') && parts[i + 1]) facId = parts[i + 1];
          if (parts[i] === 'doctor' && parts[i + 1]) docId = parts[i + 1];
        }

        if (facId && docId) {
          const isDoc = userRole === 'DOCTOR' && req.user.doctorId?.toString() === docId;
          const isFac = ['FACILITY_ADMIN', 'FACILITY_STAFF'].includes(userRole) && req.user.facilityId?.toString() === facId;
          const isAdmin = userRole === 'SYSTEM_ADMIN';

          if (isDoc || isFac || isAdmin) {
            const association = await DoctorFacilityAssociation.findOne({ doctorId: docId, facilityId: facId });
            if (association || isDoc || isFac || isAdmin) isAuthorized = true;
          }
        } else {
          if (['DOCTOR', 'FACILITY_ADMIN', 'FACILITY_STAFF', 'SYSTEM_ADMIN'].includes(userRole)) {
            isAuthorized = true;
          }
        }
      }
    }
    // Case 3: Any other room
    else {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: 'Access Denied: You are not authorized to join this communication room.',
      });
    }

    // LiveKit Access Token Generation
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const serverUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    const participantIdentity = `${userRole.toLowerCase()}_${userId}_${Date.now()}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: userName,
      ttl: '2h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      serverUrl,
      roomName,
      identity: participantIdentity,
      name: userName,
    });
  } catch (error) {
    console.error('LiveKit Token Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate LiveKit access token', error: error.message });
  }
});


module.exports = router;
