const TeleconsultationSession = require('./models/TeleconsultationSession');
const Message = require('./models/Message');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket client connected: ${socket.id}`);

    // Join Queue room
    socket.on('join_queue_room', ({ facilityId, department }) => {
      const room = `queue:${facilityId}:${department || 'General Medicine'}`;
      socket.join(room);
    });

    // Join Teleconsultation room
    socket.on('join_teleconsultation', async ({ sessionId, meetingIdentifier, userRole, name }) => {
      const targetId = meetingIdentifier || sessionId;
      const room = `telecon:${targetId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} (${userRole || 'User'} - ${name || 'Participant'}) joined ${room}`);

      let session = null;
      if (meetingIdentifier) {
        session = await TeleconsultationSession.findOne({ meetingIdentifier });
      } else if (sessionId) {
        session = await TeleconsultationSession.findById(sessionId);
      }

      if (session) {
        io.to(room).emit('telecon_status_update', {
          status: session.status,
          postSessionMessagesLeft: session.postSessionMessagesLeft,
          inSessionChat: session.inSessionChat || [],
          postSessionMessages: session.postSessionMessages || [],
        });
      }
    });

    // WebRTC Signaling: Offer, Answer, ICE Candidate
    socket.on('webrtc_offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('webrtc_offer', { offer, senderSocketId: socket.id });
    });

    socket.on('webrtc_answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('webrtc_answer', { answer, senderSocketId: socket.id });
    });

    socket.on('webrtc_ice_candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('webrtc_ice_candidate', { candidate, senderSocketId: socket.id });
    });

    // Switch Call Mode (VIDEO vs VOICE_ONLY)
    socket.on('switch_media_mode', ({ roomId, mode }) => {
      io.to(roomId).emit('media_mode_changed', { mode, senderSocketId: socket.id });
    });

    // In-Session Text Chat (during ACTIVE video/voice call)
    socket.on('send_in_session_chat', async ({ roomId, meetingIdentifier, sender, text }) => {
      try {
        const chatItem = { sender, text, timestamp: new Date() };
        if (meetingIdentifier) {
          await TeleconsultationSession.findOneAndUpdate(
            { meetingIdentifier },
            { $push: { inSessionChat: chatItem } }
          );
        }
        io.to(roomId).emit('new_in_session_chat', chatItem);
      } catch (err) {
        console.error('In-session chat error:', err.message);
      }
    });

    // Doctor/Participant terminates call
    socket.on('doctor_terminate_call', async ({ meetingIdentifier, sessionId, doctorId }) => {
      try {
        let session = null;
        if (meetingIdentifier) {
          session = await TeleconsultationSession.findOne({ meetingIdentifier });
        } else if (sessionId) {
          session = await TeleconsultationSession.findById(sessionId);
        }

        if (session) {
          session.status = 'TERMINATED';
          session.endTime = new Date();
          session.terminatedAt = new Date();
          session.terminatedBy = 'DOCTOR';
          await session.save();

          const room = `telecon:${session.meetingIdentifier || session._id}`;
          io.to(room).emit('call_terminated_by_doctor', {
            message: 'The doctor has ended the video/voice session. You can now send up to 10 post-session follow-up messages.',
            sessionStatus: 'TERMINATED',
            postSessionMessagesLeft: session.postSessionMessagesLeft,
          });
        }
      } catch (err) {
        console.error('Socket doctor_terminate_call error:', err.message);
      }
    });

    // Patient post-session follow-up message via Socket
    socket.on('send_post_session_message', async ({ meetingIdentifier, sessionId, sender, text, voiceClipUrl }) => {
      try {
        let session = null;
        if (meetingIdentifier) {
          session = await TeleconsultationSession.findOne({ meetingIdentifier });
        } else if (sessionId) {
          session = await TeleconsultationSession.findById(sessionId);
        }

        if (!session) return socket.emit('error_msg', 'Session not found');

        if (session.postSessionMessagesLeft <= 0) {
          return socket.emit('error_msg', 'Post-session message limit reached (10/10). Please book a new consultation session.');
        }

        const msgItem = {
          sender: sender || 'PATIENT',
          text: text || '',
          voiceClipUrl: voiceClipUrl || '',
          timestamp: new Date(),
        };

        session.postSessionMessages.push(msgItem);
        session.postSessionMessagesLeft -= 1;
        session.postSessionMessagesSent += 1;
        await session.save();

        const room = `telecon:${session.meetingIdentifier || session._id}`;
        io.to(room).emit('new_post_session_message', {
          message: msgItem,
          postSessionMessagesLeft: session.postSessionMessagesLeft,
        });
      } catch (err) {
        console.error('Socket send_post_session_message error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔥 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocketIO;
