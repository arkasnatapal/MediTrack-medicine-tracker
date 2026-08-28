import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Auth Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('care_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/');
      if (!isAuthUrl) {
        console.warn('Authentication token invalid or expired.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
