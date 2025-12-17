import axios from 'axios';

const API_URL = 'http://localhost:5000/api/family';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getFamilyMemberDetails = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const getFamilyConnections = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

export const inviteFamilyMember = async (data) => {
  const response = await axios.post(`${API_URL}/invite`, data, { headers: getAuthHeader() });
  return response.data;
};

export const getInvitations = async () => {
  const response = await axios.get(`${API_URL}/invitations`, { headers: getAuthHeader() });
  return response.data;
};

export const acceptInvitation = async (id) => {
  const response = await axios.post(`${API_URL}/invitations/${id}/accept`, {}, { headers: getAuthHeader() });
  return response.data;
};

export const declineInvitation = async (id) => {
  const response = await axios.post(`${API_URL}/invitations/${id}/decline`, {}, { headers: getAuthHeader() });
  return response.data;
};

export const removeFamilyMember = async (connectionId) => {
  const response = await axios.delete(`${API_URL}/${connectionId}`, { headers: getAuthHeader() });
  return response.data;
};

export const cancelInvitation = async (invitationId) => {
  const response = await axios.delete(`${API_URL}/invitations/${invitationId}`, { headers: getAuthHeader() });
  return response.data;
};

export const updateFamilyMember = async (userId, data) => {
  const response = await axios.put(`${API_URL}/${userId}`, data, { headers: getAuthHeader() });
  return response.data;
};
