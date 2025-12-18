import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/chat`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}/unread/count`, { headers: getAuthHeader() });
  return response.data;
};

export const getUnreadByUser = async () => {
  const response = await axios.get(`${API_URL}/unread/by-user`, { headers: getAuthHeader() });
  return response.data;
};

export const getMessages = async (otherUserId) => {
  const response = await axios.get(`${API_URL}/${otherUserId}`, { headers: getAuthHeader() });
  return response.data;
};

export const sendMessage = async (otherUserId, data) => {
  const response = await axios.post(`${API_URL}/${otherUserId}`, data, { headers: getAuthHeader() });
  return response.data;
};
