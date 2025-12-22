import React, { useState, useEffect } from 'react';

import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  AlertTriangle, 
  Camera, 
  Save, 
  Loader2, 
  Check,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Calendar
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import UserAvatar from '../components/UserAvatar';
import ConfirmDialog from '../components/ConfirmDialog';
import Onboarding from '../components/Onboarding';
import AIChatOnboarding from '../components/AIChatOnboarding';

const Settings = () => {
  const { user, updatePassword, toggleTwoFactor } = useAuth();
  const { theme: currentTheme, setTheme } = useTheme();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    timezone: 'Asia/Kolkata',
    profilePictureUrl: null,
    google: {
      calendarConnected: false,
      email: ''
    }
  });

  const [settings, setSettings] = useState({
    notifications: {
      emailReminders: true,
      whatsappReminders: false,
      smsReminders: false,
      inAppReminders: true,
      reminderTime: '09:00',
      weeklySummary: false,
      weeklySummaryDay: 'sunday'
    },
    appearance: {
      theme: 'system',
      language: 'en'
    },
    security: {
      twoFactorEnabled: false
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Onboarding Demo State
  const [showOnboardingDemo, setShowOnboardingDemo] = useState(false);
  const [showAIOnboardingDemo, setShowAIOnboardingDemo] = useState(false);

  useEffect(() => {
    fetchSettings();
    
    // Check for Google OAuth code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, []);

  const handleGoogleCallback = async (code) => {
    try {
      // Remove code from URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const response = await api.post('/google/oauth2/exchange', { code });
      if (response.data.success) {
        notify.success('Google Calendar connected successfully');
        setProfile(prev => ({
          ...prev,
          google: {
            calendarConnected: true,
            email: response.data.googleEmail
          }
        }));
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      notify.error('Failed to connect Google Calendar');
    }
  };

  const connectGoogle = async () => {
    try {
      const response = await api.get('/google/oauth2/url?mode=connect');
      if (response.data.success && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      notify.error('Failed to initiate Google connection');
    }
  };

  const disconnectGoogle = async () => {
    try {
      const response = await api.post('/google/disconnect');
      if (response.data.success) {
        notify.success('Google Calendar disconnected');
        setProfile(prev => ({
          ...prev,
          google: {
            calendarConnected: false,
            email: ''
          }
        }));
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      notify.error('Failed to disconnect Google Calendar');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.success) {
        const { user } = response.data;
        
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          gender: user.gender || '',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
          address: user.address || '',
          timezone: user.timezone || 'Asia/Kolkata',
          profilePictureUrl: user.profilePictureUrl,
          google: user.google || { calendarConnected: false, email: '' }
        });

        if (user.settings) {
          setSettings(prev => ({
            notifications: { ...prev.notifications, ...user.settings.notifications },
            appearance: { ...prev.appearance, ...user.settings.appearance },
            security: { ...prev.security, ...user.settings.security }
          }));
        }
        
        if (user.twoFactorEnabled !== undefined) {
             setSettings(prev => ({
                ...prev,
                security: { ...prev.security, twoFactorEnabled: user.twoFactorEnabled }
             }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      notify.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);

    try {
      const response = await api.post('/settings/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setProfile(prev => ({ ...prev, profilePictureUrl: response.data.profilePictureUrl }));
        notify.success('Profile picture updated');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      notify.error(error.response?.data?.message || 'Failed to upload image');
      setUploadingAvatar(false);
    } finally {
      e.target.value = '';
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        ...profile,
        settings
      };
      
      const response = await api.put('/settings', payload);
      if (response.data.success) {
        notify.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      notify.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return notify.error('New passwords do not match');
    }

    const success = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleToggleTwoFactor = async (e) => {
      const success = await toggleTwoFactor();
      if (success) {
          setSettings(prev => ({
              ...prev,
              security: { ...prev.security, twoFactorEnabled: !prev.security.twoFactorEnabled }
          }));
      }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = async () => {

    try {
      const response = await api.delete('/settings/account', { data: { confirm: true } });
      if (response.data.success) {
        notify.success('Account deleted');
        window.location.href = '/login';
      }
    } catch (error) {
      notify.error('Failed to delete account');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  // Animation Variants


  if (loading) return <Loader fullScreen text="Loading settings..." />;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Reminders', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-10 h-screen overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-emerald-500" />
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
              Manage your account preferences and settings
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden sticky top-4">
                <div className="p-4 space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                        activeTab === tab.id 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 translate-x-1' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                      } ${tab.id === 'danger' && activeTab !== 'danger' ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10' : ''} ${tab.id === 'danger' && activeTab === 'danger' ? '!bg-red-500 !text-white !shadow-red-500/20' : ''}`}
                    >
                      <tab.icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-8 space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-lg relative">
                        {uploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        )}
                        <UserAvatar 
                          user={profile} 
                          className="h-full w-full text-4xl" 
                          fallbackType="initial"
                        />
                      </div>
                      <label className={`absolute bottom-0 z-100 right-0 p-2 bg-emerald-500 rounded-full shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors ${uploadingAvatar ? 'pointer-events-none opacity-50' : ''}`}>
                        <Camera className="h-4 w-4 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleAvatarUpload} 
                          disabled={uploadingAvatar}
                          onClick={(e) => { e.target.value = null }}
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={profile.name} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={profile.email} 
                        disabled 
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phoneNumber"
                        value={profile.phoneNumber} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                      <select 
                        name="gender"
                        value={profile.gender} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem'
                        }}
                      >
                        <option value="" className="bg-white dark:bg-slate-800">Select Gender</option>
                        <option value="male" className="bg-white dark:bg-slate-800">Male</option>
                        <option value="female" className="bg-white dark:bg-slate-800">Female</option>
                        <option value="other" className="bg-white dark:bg-slate-800">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                      <input 
                        type="date" 
                        name="dateOfBirth"
                        value={profile.dateOfBirth} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                      <select 
                        name="timezone"
                        value={profile.timezone} 
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem'
                        }}
                      >
                        <option value="Asia/Kolkata" className="bg-white dark:bg-slate-800">Asia/Kolkata (IST)</option>
                        <option value="UTC" className="bg-white dark:bg-slate-800">UTC</option>
                        <option value="America/New_York" className="bg-white dark:bg-slate-800">New York (EST)</option>
                        <option value="Europe/London" className="bg-white dark:bg-slate-800">London (GMT)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                      <textarea 
                        name="address"
                        value={profile.address} 
                        onChange={handleProfileChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                        placeholder="Enter your full address"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={saveSettings} 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-8 space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">Reminder Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">In-App Reminders</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications within the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.inAppReminders}
                          onChange={(e) => handleSettingsChange('notifications', 'inAppReminders', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Email Reminders</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive daily summaries via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.emailReminders}
                          onChange={(e) => handleSettingsChange('notifications', 'emailReminders', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">WhatsApp Reminders</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive critical alerts on WhatsApp</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.whatsappReminders}
                          onChange={(e) => handleSettingsChange('notifications', 'whatsappReminders', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div> */}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-500" />
                      Google Calendar Integration
                    </h4>
                    
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {profile.google?.calendarConnected ? 'Connected' : 'Not Connected'}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {profile.google?.calendarConnected 
                              ? `Syncing with ${profile.google.email}` 
                              : 'Sync reminders with your Google Calendar'}
                          </p>
                        </div>
                        <button
                          onClick={profile.google?.calendarConnected ? disconnectGoogle : connectGoogle}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            profile.google?.calendarConnected
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                          }`}
                        >
                          {profile.google?.calendarConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Daily Reminder Time</label>
                    <input 
                      type="time" 
                      value={settings.notifications.reminderTime}
                      onChange={(e) => handleSettingsChange('notifications', 'reminderTime', e.target.value)}
                      className="w-full max-w-xs px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">We'll send your daily summary at this time.</p>
                  </div> */}

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={saveSettings} 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-8 space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">App Appearance</h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Theme</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => {
                            handleSettingsChange('appearance', 'theme', theme.value);
                            setTheme(theme.value);
                          }}
                          className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                            settings.appearance.theme === theme.value 
                              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-lg scale-105' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50'
                          }`}
                        >
                          <theme.icon className="h-8 w-8" />
                          <span className="font-bold">{theme.label}</span>
                          {settings.appearance.theme === theme.value && (
                            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Onboarding Tours</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View the welcome tours again</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowOnboardingDemo(true)}
                        className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 font-medium text-sm transition-all"
                      >
                        Show App Onboarding
                      </button>
                      <button
                        onClick={() => setShowAIOnboardingDemo(true)}
                        className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 font-medium text-sm transition-all"
                      >
                        Show AI Onboarding
                      </button>
                    </div>
                  </div> */}


                  {/* --------FEAURE TO BE INTEGRATED LATER---------  */}
                      
                  {/* <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Language</label>
                    <select 
                      value={settings.appearance.language}
                      onChange={(e) => handleSettingsChange('appearance', 'language', e.target.value)}
                      className="w-full max-w-xs px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.25rem'
                      }}
                    >
                      <option value="en" className="bg-white dark:bg-slate-800">English</option>
                      <option value="hi" className="bg-white dark:bg-slate-800">Hindi (हिंदी)</option>
                      <option value="es" className="bg-white dark:bg-slate-800">Spanish (Español)</option>
                      <option value="fr" className="bg-white dark:bg-slate-800">French (Français)</option>
                    </select>
                  </div> */}

{/* 
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Onboarding Tour</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View the welcome tour again</p>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('meditrack_onboarding_seen');
                          window.location.reload();
                        }}
                        className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 font-medium text-sm transition-all"
                      >
                        Show Onboarding
                      </button>
                    </div>
                  </div> */}

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={saveSettings} 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-8 space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">Security Settings</h3>
                  
                  <form onSubmit={changePassword} className="space-y-4 max-w-md">
                    <h4 className="font-bold text-slate-900 dark:text-white">Change Password</h4>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        required
                        minLength={6}
                      />
                    </div>
                    <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all">
                      Update Password
                    </button>
                  </form>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    {!profile.google?.id && (
                    <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.security.twoFactorEnabled}
                          onChange={handleToggleTwoFactor}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={saveSettings} 
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="rounded-3xl bg-red-50/70 dark:bg-red-900/10 backdrop-blur-xl border-2 border-red-200 dark:border-red-900/30 shadow-xl p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-900 dark:text-red-200">Delete Account</h3>
                      <p className="text-red-700 dark:text-red-300 mt-2">
                        Once you delete your account, there is no going back. Please be certain.
                        All your medicines, reminders, and history will be permanently removed.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border-2 border-red-200 dark:border-red-900/30">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        placeholder="DELETE"
                      />
                      <button 
                        onClick={deleteAccount}
                        disabled={deleteConfirm !== 'DELETE'}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg whitespace-nowrap"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure? This action cannot be undone. All your data will be permanently lost."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
      />
      {/* Onboarding Demos */}
      {showOnboardingDemo && (
        <Onboarding 
          forceOpen={true} 
          onClose={() => setShowOnboardingDemo(false)} 
        />
      )}
      {showAIOnboardingDemo && (
        <AIChatOnboarding 
          forceOpen={true} 
          onClose={() => setShowAIOnboardingDemo(false)} 
        />
      )}
    </div>
  );
};

export default Settings;

