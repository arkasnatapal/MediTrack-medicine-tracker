import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('care_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Failed to load user session:', err);
          localStorage.removeItem('care_token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password, loginType) => {
    const res = await api.post('/auth/login', { email, password, loginType });
    localStorage.setItem('care_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const registerFacility = async (facilityData) => {
    const res = await api.post('/auth/register-facility', facilityData);
    localStorage.setItem('care_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const registerDoctor = async (doctorData) => {
    const res = await api.post('/auth/register-doctor', doctorData);
    localStorage.setItem('care_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('care_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerFacility, registerDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
