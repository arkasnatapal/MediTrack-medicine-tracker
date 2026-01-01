import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();

    // Heartbeat to keep lastActive fresh
    const heartbeatInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        api.get('/auth/me').catch(() => {}); // Fire and forget
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Check for 2FA requirement
      if (response.data.requireTwoFactor) {
        return {
          success: false,
          requireTwoFactor: true,
          email: response.data.email
        };
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      notify.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.requireVerification) {
        return { 
          success: false, 
          requireVerification: true, 
          email: error.response.data.email 
        };
      }
      // Fallback for 2FA if backend sends it as error (though it sends 200 now)
      if (error.response?.data?.requireTwoFactor) {
        return {
          success: false,
          requireTwoFactor: true,
          email: error.response.data.email
        };
      }
      notify.error(error.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const verifyLoginOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-login-otp', { email, otp });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      notify.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Verify login OTP error:', error);
      notify.error(error.response?.data?.message || 'Invalid OTP');
      return false;
    }
  };

  const signup = async (name, email, password, gender, familyMedicalHistory) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, gender, familyMedicalHistory });
      if (response.data.requireVerification) {
        notify.success('Registration successful. Please verify your email.');
        return { success: true, requireVerification: true, email };
      }
      
      // Fallback for old flow (shouldn't happen with new backend)
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      notify.success('Signup successful!');
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      notify.error(error.response?.data?.message || 'Signup failed');
      return { success: false };
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-email', { email, otp });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      notify.success('Email verified successfully!');
      return true;
    } catch (error) {
      console.error('Verification error:', error);
      notify.error(error.response?.data?.message || 'Verification failed');
      return false;
    }
  };

  const resendOtp = async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
      notify.success('OTP resent successfully!');
      return true;
    } catch (error) {
      console.error('Resend OTP error:', error);
      notify.error(error.response?.data?.message || 'Failed to resend OTP');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    notify.info('Logged out');
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      setUser(response.data.user);
      notify.success('Profile updated!');
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      notify.error(error.response?.data?.message || 'Update failed');
      return false;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/update-password', { currentPassword, newPassword });
      notify.success('Password updated successfully!');
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      notify.error(error.response?.data?.message || 'Failed to update password');
      return false;
    }
  };

  const toggleTwoFactor = async () => {
    try {
      const response = await api.put('/auth/toggle-2fa');
      setUser(prev => ({ ...prev, twoFactorEnabled: response.data.twoFactorEnabled }));
      notify.success(response.data.message);
      return true;
    } catch (error) {
      console.error('Toggle 2FA error:', error);
      notify.error(error.response?.data?.message || 'Failed to toggle 2FA');
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      notify.success('If an account exists, an OTP has been sent.');
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      notify.error(error.response?.data?.message || 'Failed to send OTP');
      return false;
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp });
      return { success: true, resetToken: response.data.resetToken };
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      notify.error(error.response?.data?.message || 'Invalid OTP');
      return { success: false };
    }
  };

  const resetPassword = async (resetToken, newPassword) => {
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      notify.success('Password reset successfully! Please login.');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      notify.error(error.response?.data?.message || 'Failed to reset password');
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    verifyEmail,
    resendOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    verifyLoginOtp,
    updatePassword,
    toggleTwoFactor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
