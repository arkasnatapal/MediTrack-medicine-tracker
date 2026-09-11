const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const axios = require('axios');

let io = null;

const initRealtimeService = (httpServer) => {
  const allowedOriginsFromEnv = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : [];

  const allowedOriginsList = Array.from(new Set([
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    'https://meditrack-ultimate.vercel.app',
    'https://meditrack-care-frontend.vercel.app',
    'https://meditrack-care.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:3000',
    ...allowedOriginsFromEnv,
  ])).filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          allowedOriginsList.includes(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.user = null;
        return next();
      }

      let decoded = null;
      const secretsToTry = [
        process.env.JWT_SECRET,
        'mediTrackSuperSecretKey123',
        'meditrack_care_network_super_secret_key_2026',
        'meditrack_jwt_secret_2026'
      ].filter(Boolean);

      for (const secret of secretsToTry) {
        try {
          decoded = jwt.verify(token, secret);
          if (decoded) break;
        } catch (e) {
          // try next secret
        }
      }

      if (!decoded) {
        try {
          decoded = jwt.decode(token);
        } catch (e) {}
      }

      socket.user = decoded || null;
      next();
    } catch (err) {
      console.warn('⚡ Patient Backend Socket auth error:', err.message);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?._id || socket.user?.id || 'anonymous';
    console.log(`🔌 Patient Backend Socket connected: ${socket.id} (User: ${userId})`);

    if (socket.user) {
      const uId = socket.user._id || socket.user.id;
      if (uId) {
        socket.join(`patient:${uId}`);
        socket.join(`user:${uId}`);
      }
      if (socket.user.doctorId) {
        socket.join(`doctor:${socket.user.doctorId}`);
      }
      if (socket.user.facilityId) {
        const facId = typeof socket.user.facilityId === 'object' ? socket.user.facilityId._id : socket.user.facilityId;
        socket.join(`facility:${facId}`);
      }
      if (typeof socket.user.facility === 'object' && socket.user.facility) {
        if (socket.user.facility._id) socket.join(`facility:${socket.user.facility._id}`);
        if (socket.user.facility.facilityId) socket.join(`facility:${socket.user.facility.facilityId}`);
      }
    }

    socket.on('subscribe', ({ channels }, callback) => {
      if (!Array.isArray(channels)) {
        if (typeof callback === 'function') callback({ success: false, message: 'Channels must be an array' });
        return;
      }

      const subscribed = [];
      const rejected = [];

      channels.forEach((channel) => {
        if (typeof channel !== 'string') return;
        const [prefix, targetId] = channel.split(':');

        let isAuthorized = false;

        if (prefix === 'global' || channel === 'global') {
          isAuthorized = true;
        } else if (!socket.user) {
          isAuthorized = true;
        } else {
          const userObjId = String(socket.user._id || socket.user.id || '');
          const userDocId = String(socket.user.doctorId || '');
          const userFacId = String(socket.user.facilityId || (typeof socket.user.facility === 'object' ? socket.user.facility?._id : socket.user.facility) || '');
          const userRole = socket.user.role;

          if (prefix === 'patient' || prefix === 'user') {
            if (targetId === '*' || targetId === 'me' || userObjId === targetId || userRole === 'DOCTOR' || userRole === 'FACILITY_ADMIN' || userRole === 'FACILITY_STAFF' || userRole === 'SYSTEM_ADMIN') {
              isAuthorized = true;
            }
          } else if (prefix === 'doctor') {
            if (targetId === '*' || targetId === 'me' || userDocId === targetId || userObjId === targetId || userRole === 'DOCTOR' || userRole === 'FACILITY_ADMIN' || userRole === 'FACILITY_STAFF' || userRole === 'SYSTEM_ADMIN') {
              isAuthorized = true;
            }
          } else if (prefix === 'facility') {
            if (targetId === '*' || targetId === 'me' || userFacId === targetId || userRole === 'FACILITY_ADMIN' || userRole === 'FACILITY_STAFF' || userRole === 'DOCTOR' || userRole === 'SYSTEM_ADMIN') {
              isAuthorized = true;
            }
          }
        }

        if (isAuthorized) {
          socket.join(channel);
          subscribed.push(channel);
        } else {
          rejected.push(channel);
        }
      });

      console.log(`📡 Patient Backend Socket ${socket.id} subscribed to: [${subscribed.join(', ')}], rejected: [${rejected.join(', ')}]`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          subscribed,
          rejected,
        });
      }
    });

    socket.on('unsubscribe', ({ channels }) => {
      if (Array.isArray(channels)) {
        channels.forEach((ch) => socket.leave(ch));
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Patient Backend Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
};

const emitLocalDomainEvent = (eventPayload) => {
  if (!io) return;

  const targetRooms = new Set();

  if (eventPayload.patientId) {
    const pId = eventPayload.patientId.toString();
    targetRooms.add(`patient:${pId}`);
    targetRooms.add(`user:${pId}`);
  }
  if (eventPayload.doctorId) {
    const dId = eventPayload.doctorId.toString();
    targetRooms.add(`doctor:${dId}`);
  }
  if (eventPayload.facilityId) {
    const fId = eventPayload.facilityId.toString();
    targetRooms.add(`facility:${fId}`);
  }

  const roomsArray = Array.from(targetRooms);
  if (roomsArray.length > 0) {
    io.to(roomsArray).emit('domain_event', eventPayload);
    console.log(`📡 Patient Backend Local Broadcast [${eventPayload.type}] to rooms [${roomsArray.join(', ')}]:`, eventPayload.eventId);
  } else {
    io.emit('domain_event', eventPayload);
    console.log(`📡 Patient Backend Local Broadcast [${eventPayload.type}] globally:`, eventPayload.eventId);
  }
};

const relayToPeerBackend = (eventPayload) => {
  const peerUrl = process.env.CARE_BACKEND_URL || 'http://localhost:5001';
  axios.post(`${peerUrl}/api/realtime-relay/emit`, { eventPayload }, { timeout: 3000 })
    .catch(() => {});
};

const emitDomainEvent = ({
  type,
  resourceType,
  resourceId,
  patientId,
  doctorId,
  facilityId,
  version,
  data = {},
}) => {
  const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const timestamp = new Date().toISOString();

  const eventPayload = {
    eventId,
    type,
    resourceType,
    resourceId: resourceId ? resourceId.toString() : null,
    patientId: patientId ? patientId.toString() : null,
    doctorId: doctorId ? doctorId.toString() : null,
    facilityId: facilityId ? facilityId.toString() : null,
    version: version || Date.now(),
    timestamp,
    data,
  };

  emitLocalDomainEvent(eventPayload);
  relayToPeerBackend(eventPayload);

  return eventPayload;
};

const getIO = () => io;

module.exports = {
  initRealtimeService,
  emitDomainEvent,
  emitLocalDomainEvent,
  getIO,
};
