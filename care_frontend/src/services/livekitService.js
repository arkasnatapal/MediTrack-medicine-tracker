import api from './api';

/**
 * Request a LiveKit token from care_backend for a given room.
 * @param {string} roomName - The deterministic room identifier (e.g. "telecon_MEET-123" or "hospital_123_doctor_456")
 * @param {string} participantName - Display name of the participant
 * @returns {Promise<{token: string, serverUrl: string, roomName: string}>}
 */
export const getLiveKitToken = async (roomName, participantName) => {
  try {
    const res = await api.post('/livekit/token', {
      roomName,
      participantName,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to obtain LiveKit token:', error?.response?.data || error.message);
    throw error;
  }
};
