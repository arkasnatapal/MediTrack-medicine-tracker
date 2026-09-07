import axios from 'axios';

const CARE_BACKEND_URL = import.meta.env.VITE_CARE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://meditrack-careback-ult.vercel.app');

/**
 * Request a LiveKit token from care_backend for a given room.
 * @param {string} roomName - The room identifier (e.g. "telecon_MEET-123")
 * @param {string} participantName - Display name of the participant
 * @returns {Promise<{token: string, serverUrl: string, roomName: string}>}
 */
export const getLiveKitToken = async (roomName, participantName) => {
  try {
    const res = await axios.post(`${CARE_BACKEND_URL}/api/livekit/token`, {
      roomName,
      participantName,
    });
    return res.data;
  } catch (error) {
    console.error('Failed to obtain LiveKit token:', error?.response?.data || error.message);
    throw error;
  }
};
