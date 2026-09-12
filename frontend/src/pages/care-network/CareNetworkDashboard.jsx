import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, Search, Stethoscope, Calendar, Clock, GitMerge, Activity, 
  Pill, Video, Milestone, Building2, PhoneCall, ChevronRight, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, Sun, Moon, RefreshCw,
  Bed, HeartPulse, ShieldCheck, Radio, Zap, Ticket
} from 'lucide-react';
import { useAppMode } from '../../context/AppModeContext';
import { useTheme } from '../../context/ThemeContext';
import { locationService } from '../../services/locationService';
import useRealtimeSync from '../../hooks/useRealtimeSync';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareNetworkDashboard = () => {
  const navigate = useNavigate();
  const { t } = useAppMode();
  const { theme, setTheme } = useTheme();

  const [nearbyFacilities, setNearbyFacilities] = useState(() => locationService.getCachedFacilities('dashboard') || []);
  const [loadingFacilities, setLoadingFacilities] = useState(() => !(locationService.getCachedFacilities('dashboard')?.length > 0));
  const [userLocation, setUserLocation] = useState(() => locationService.getCachedLocation() || locationService.getDefaultLocation());
  const [isRefreshingLoc, setIsRefreshingLoc] = useState(false);

  const [userAppointments, setUserAppointments] = useState([]);
  const [queueDataMap, setQueueDataMap] = useState({});
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload._id || payload.id;
    } catch (e) {
      return null;
    }
  };
  const currentUserId = getUserIdFromToken();

  useRealtimeSync({
    channels: [
      'global',
      currentUserId ? `patient:${currentUserId}` : null,
      currentUserId ? `user:${currentUserId}` : null,
    ].filter(Boolean),
    onEvent: (eventPayload) => {
      console.log('⚡ Realtime Event in CareNetworkDashboard:', eventPayload);
      fetchUserAppointments();
    },
    onReconnectRefetch: () => {
      fetchUserAppointments();
    }
  });

  useEffect(() => {
    initLocationAndFacilities();
    fetchUserAppointments();
  }, []);

  useEffect(() => {
    if (!userAppointments || userAppointments.length === 0) return;
    const interval = setInterval(() => {
      fetchQueueStatuses(userAppointments);
    }, 4000);
    return () => clearInterval(interval);
  }, [userAppointments]);

  const fetchUserAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/appointments/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.appointments) {
        // Exclude COMPLETED and CANCELLED appointments from Active Tokens widget
        const activeOnly = res.data.appointments.filter(
          a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
        );
        setUserAppointments(activeOnly);
        fetchQueueStatuses(activeOnly);
      }
    } catch (err) {
      console.warn('Error fetching patient appointments for widget:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchQueueStatuses = async (apts) => {
    if (!apts || apts.length === 0) return;
    const newMap = {};
    for (const apt of apts) {
      const aptKey = apt.appointmentId || apt._id;
      const facId = apt.facilityId || 'FAC-DEFAULT';
      const userAptToken = apt.tokenNumber || 0;
      try {
        const dept = apt.department || 'General OPD';
        const res = await axios.get(`${API_BASE}/care-network/queue/${facId}?department=${encodeURIComponent(dept)}&tokenNumber=${userAptToken || ''}`);
        if (res.data && res.data.success) {
          newMap[aptKey] = {
            userToken: userAptToken > 0 ? (res.data.userToken || userAptToken) : 0,
            currentToken: res.data.currentToken || 0,
            positionInLine: userAptToken > 0 ? (res.data.positionInLine !== undefined ? res.data.positionInLine : Math.max(0, userAptToken - (res.data.currentToken || 1))) : 0,
            estimatedWaitMinutes: userAptToken > 0 ? (res.data.estimatedWaitMinutes || 0) : 0
          };
        }
      } catch (err) {
        newMap[aptKey] = {
          userToken: userAptToken,
          currentToken: 0,
          positionInLine: userAptToken > 0 ? Math.max(0, userAptToken - 1) : 0,
          estimatedWaitMinutes: userAptToken > 0 ? Math.max(0, userAptToken - 1) * 5 : 0
        };
      }
    }
    setQueueDataMap(newMap);
  };

  const initLocationAndFacilities = async (forceRefresh = false) => {
    const cachedFacs = locationService.getCachedFacilities('dashboard');
    const cachedLoc = locationService.getCachedLocation();

    if (!forceRefresh && cachedFacs && cachedFacs.length > 0) {
      setNearbyFacilities(cachedFacs);
      setLoadingFacilities(false);
    } else {
      setLoadingFacilities(true);
    }

    let freshLoc = userLocation || cachedLoc || locationService.getDefaultLocation();
    try {
      const currentLoc = await locationService.getCurrentLocation();
      if (currentLoc && typeof currentLoc.latitude === 'number') {
        freshLoc = currentLoc;
      }
    } catch (err) {
      console.warn('GPS location request error, using fallback:', err);
    }
    setUserLocation(freshLoc);

    const locChanged = locationService.hasLocationChanged(freshLoc, cachedLoc, 0.5);

    if (!forceRefresh && !locChanged && cachedFacs && cachedFacs.length > 0) {
      console.log('⚡ Dashboard using cached facilities (location delta < 0.5km).');
      setLoadingFacilities(false);
      setIsRefreshingLoc(false);
      return;
    }

    locationService.saveCachedLocation(freshLoc);

    try {
      const res = await axios.get(`${API_BASE}/care-network/facilities?lat=${freshLoc.latitude}&lng=${freshLoc.longitude}`);
      if (res.data && res.data.facilities) {
        setNearbyFacilities(res.data.facilities);
        locationService.saveCachedFacilities(res.data.facilities, freshLoc, 'dashboard');
      }
    } catch (err) {
      console.error('Error fetching dashboard facilities:', err);
    } finally {
      setLoadingFacilities(false);
      setIsRefreshingLoc(false);
    }
  };

  const handleRefreshLocation = () => {
    setIsRefreshingLoc(true);
    initLocationAndFacilities(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const serviceCards = [
    {
      id: 'find-care',
      title: t('findPublicHealthcare') || 'Find Healthcare Facility',
      subtitle: t('findPublicHealthcareDesc') || 'Locate PHC, CHC, Rural & District Hospitals',
      icon: Search,
      path: '/care-network/find-care',
      gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'hover:border-blue-500/50',
      iconColor: 'text-blue-500',
      badge: 'PHC / CHC / District'
    },
    {
      id: 'triage',
      title: t('digitalTriage') || 'Digital Triage',
      subtitle: t('digitalTriageDesc') || 'Smart urgency evaluation & direct triage advice',
      icon: Stethoscope,
      path: '/care-network/triage',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'hover:border-emerald-500/50',
      iconColor: 'text-emerald-500',
      badge: 'Urgency Engine'
    },
    {
      id: 'appointments',
      title: t('appointments') || 'OPD Token Booking',
      subtitle: t('appointmentsDesc') || 'Reserve your OPD consultation slot & token',
      icon: Calendar,
      path: '/care-network/appointments',
      gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
      borderColor: 'hover:border-purple-500/50',
      iconColor: 'text-purple-500',
      badge: 'Token System'
    },
    {
      id: 'queue',
      title: t('queueStatus') || 'Live Queue Status',
      subtitle: t('queueStatusDesc') || 'Real-time token position & estimated wait time',
      icon: Clock,
      path: '/care-network/appointments',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'hover:border-amber-500/50',
      iconColor: 'text-amber-500',
      badge: 'Live Tracker'
    },
    {
      id: 'referrals',
      title: t('referralTracking') || 'Referral Tracker',
      subtitle: t('referralTrackingDesc') || 'Multi-tier healthcare referral status & logs',
      icon: GitMerge,
      path: '/care-network/referrals',
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderColor: 'hover:border-cyan-500/50',
      iconColor: 'text-cyan-500',
      badge: 'Tier Network'
    },
    {
      id: 'diagnostics',
      title: t('diagnosticAvailability') || 'Diagnostic Availability',
      subtitle: t('diagnosticAvailabilityDesc') || 'Check availability for ECG, X-Ray, CT Scan & MRI',
      icon: Activity,
      path: '/care-network/diagnostics',
      gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
      borderColor: 'hover:border-rose-500/50',
      iconColor: 'text-rose-500',
      badge: 'ECG / X-Ray / CT'
    },
    {
      id: 'medicines',
      title: t('medicineAvailability') || 'Medicine Availability',
      subtitle: t('medicineAvailabilityDesc') || 'Search local public stock & OpenFDA drug info',
      icon: Pill,
      path: '/care-network/medicines',
      gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
      borderColor: 'hover:border-teal-500/50',
      iconColor: 'text-teal-500',
      badge: 'Public Pharmacy'
    },
    {
      id: 'teleconsultation',
      title: t('teleconsultation') || 'Teleconsultation',
      subtitle: t('teleconsultationDesc') || 'Connect directly with specialist medical officers',
      icon: Video,
      path: '/care-network/teleconsultation',
      gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
      borderColor: 'hover:border-indigo-500/50',
      iconColor: 'text-indigo-500',
      badge: 'Specialist Hub'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      
      {/* GLASS HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800/80 shadow-2xl p-6 sm:p-10 transition-all duration-300">
        
        {/* Glowing Background Ambient Orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 dark:bg-blue-400/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Connected Public Healthcare • Pan-India</span>
              </div>

              {/* Location Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{userLocation?.city ? `${userLocation.city}${userLocation.region ? `, ${userLocation.region}` : ''}` : 'Location Active'}</span>
                <button
                  onClick={handleRefreshLocation}
                  disabled={isRefreshingLoc}
                  className="ml-1 p-0.5 rounded-full hover:bg-emerald-500/20 transition-all active:scale-95"
                  title="Refresh GPS Location"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingLoc ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              CARE NETWORK <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500">DASHBOARD</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Real-time access to public healthcare facilities, live OPD queues, triage guidance, digital prescriptions & diagnostic availability across all tiers.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/care-network/triage')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Start Digital Triage</span>
              </button>

              <button
                onClick={() => navigate('/care-network/diagnostics')}
                className="px-5 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md transition-all flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Search Diagnostics</span>
              </button>
            </div>
          </div>

          {/* THEME TOGGLE & QUICK OVERVIEW CARD */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 shrink-0">
         

            {/* Network Health Status Badge */}
            <div className="bg-emerald-500/10 dark:bg-emerald-500/15 p-4 rounded-2xl border border-emerald-500/30 backdrop-blur-md flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Care Network Operational
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  All 5 Healthcare Tiers Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT EMERGENCY BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 dark:from-rose-600 dark:via-red-600 dark:to-rose-700 text-slate-900 dark:text-white p-5 sm:p-7 shadow-xl border border-rose-200/80 dark:border-rose-400/30 relative overflow-hidden backdrop-blur-md"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 dark:bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 dark:bg-white"></span>
              </span>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-wide flex items-center gap-2 text-rose-950 dark:text-white">
                🚨 {t('needImmediateHelp') || 'Emergency Trauma & Cardiac Medical Response'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-100 font-medium leading-relaxed">
              {t('emergencyNotice') || 'For life-threatening conditions (chest pain, severe breathlessness, accident trauma), call emergency response immediately.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            <a
              href="tel:112"
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white dark:bg-white dark:text-rose-700 font-black text-center shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4 text-white dark:text-rose-600 shrink-0" />
              <span>DIAL 112</span>
            </a>

            <a
              href="tel:108"
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/90 hover:bg-white text-rose-900 border border-rose-300 dark:bg-black/30 dark:hover:bg-black/40 dark:text-white dark:border-white/30 font-bold text-center backdrop-blur-md transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm shadow-sm whitespace-nowrap"
            >
              <PhoneCall className="w-4 h-4 text-rose-600 dark:text-amber-300 shrink-0" />
              <span>DIAL 108 (AMBULANCE)</span>
            </a>

            <button
              onClick={() => navigate('/care-network/emergency')}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/90 hover:bg-white text-rose-900 border border-rose-300 dark:bg-black/40 dark:hover:bg-black/50 dark:text-white dark:border-white/30 font-bold text-center backdrop-blur-md transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-amber-300 shrink-0" />
              <span>{t('findImmediateCare') || 'Nearest Emergency Center'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* DYNAMIC ACTIVE TOKEN QUEUE WIDGET */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl transition-all duration-300"
      >
        {/* Glowing background ambient lights */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Live Smart OPD Wait-Time Monitor</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Active OPD Appointments & Token Queue {userAppointments.length > 0 ? `(${userAppointments.length})` : ''}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Real-time OPD queue tracker, hospital permission status & adaptive wait time calculations
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/care-network/appointments')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>+ Book OPD Token</span>
            </button>

            <button
              onClick={() => fetchUserAppointments()}
              disabled={loadingAppointments}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold border border-slate-300 dark:border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Refresh Live Token Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* TOKEN CARDS OR EMPTY STATE */}
        {userAppointments && userAppointments.length > 0 ? (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {userAppointments.map((apt, index) => {
              const aptKey = apt.appointmentId || apt._id;
              const qData = queueDataMap[aptKey] || {};
              const currentServing = qData.currentToken || 1;
              const userTokenNum = apt.tokenNumber || qData.userToken || 1;
              const peopleAhead = qData.positionInLine !== undefined 
                ? qData.positionInLine 
                : Math.max(0, userTokenNum - currentServing);
              const estWaitMinutes = qData.estimatedWaitMinutes !== undefined 
                ? qData.estimatedWaitMinutes 
                : (peopleAhead * (qData.averageConsultationMinutes || 7));
              const isNowServing = peopleAhead === 0 && apt.status !== 'COMPLETED';
              const isPendingApproval = apt.status === 'PENDING_APPROVAL';

              return (
                <div
                  key={aptKey || index}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 backdrop-blur-md hover:border-emerald-500/50 transition-all duration-300 shadow-md relative overflow-hidden"
                >
                  {/* Status indicator bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {apt.department || 'General OPD'}
                    </span>

                    {isPendingApproval ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                        <span>⏳ Awaiting Hospital Permission</span>
                      </span>
                    ) : (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isNowServing 
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 animate-pulse' 
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{isNowServing ? 'NOW SERVING YOU' : '✓ Confirmed by Hospital'}</span>
                      </span>
                    )}
                  </div>

                  {/* Facility Name & Time */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{apt.facilityName || 'Healthcare Center'}</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-2">
                      <span>📅 {apt.date || 'Today'}</span>
                      <span>•</span>
                      <span>⏰ {apt.time || '10:00 AM'}</span>
                    </p>
                  </div>

                  {/* Main Token & Queue Comparison Stats */}
                  <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-center shadow-inner">
                    {/* PATIENT TOKEN */}
                    <div className="space-y-0.5">
                      <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Token #</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">#{userTokenNum}</div>
                    </div>

                    {/* CURRENTLY SERVING TOKEN */}
                    <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700/80">
                      <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Now Serving</div>
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400">#{currentServing}</div>
                    </div>

                    {/* PEOPLE AHEAD IN QUEUE */}
                    <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700/80">
                      <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Ahead</div>
                      <div className={`text-lg font-black ${peopleAhead === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {peopleAhead}
                      </div>
                    </div>

                    {/* ESTIMATED WAIT TIME */}
                    <div className="space-y-0.5 border-l border-slate-200 dark:border-slate-700/80">
                      <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Est. Time</div>
                      <div className="text-base font-black text-amber-600 dark:text-amber-400 truncate">
                        {peopleAhead === 0 ? 'Next' : `~${estWaitMinutes}m`}
                      </div>
                    </div>
                  </div>

                  {/* Footer with estimated wait time & navigation action */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Estimated Wait: <strong className="text-slate-900 dark:text-white">{peopleAhead === 0 ? 'Direct Entry' : `~${estWaitMinutes} Mins`}</strong></span>
                    </span>

                    <button
                      onClick={() => navigate('/care-network/appointments')}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Full Queue</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative z-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Ticket className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active OPD Appointment Tokens</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Reserve your live consultation token to track real-time queue position, doctor progress, and adaptive estimated wait times.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/care-network/appointments')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Live OPD Token Now</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>



      {/* NEARBY PUBLIC FACILITIES SHOWCASE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Healthcare Facilities Near You</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discovered automatically based on your location ({userLocation?.city || 'Your Area'})
            </p>
          </div>

          <Link
            to="/care-network/find-care"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Facilities</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingFacilities ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyFacilities.slice(0, 3).map((facility, index) => {
              const isClosest = facility.isNearest || index === 0;
              return (
                <div
                  key={facility.facilityId}
                  onClick={() => navigate(`/care-network/facility/${facility.facilityId}`)}
                  className={`backdrop-blur-xl p-5 rounded-3xl border transition-all duration-300 cursor-pointer space-y-3 group ${
                    isClosest 
                      ? 'bg-white/70 dark:bg-slate-800/80 border-emerald-500/80 shadow-xl ring-2 ring-emerald-500/20' 
                      : 'bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-slate-800/70 shadow-md hover:shadow-xl hover:border-blue-500/50'
                  }`}
                >
                  {isClosest && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      <span>📍 NEAREST FACILITY ({facility.distanceKm} KM)</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      facility.facilityType === 'DISTRICT_HOSPITAL' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                      facility.facilityType === 'RURAL_HOSPITAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {facility.facilityType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{facility.distanceKm} km</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {facility.taluka}, {facility.district}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>24/7 Emergency Available</span>
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HEALTHCARE ACCESS MODULES GRID */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Care Network Access Modules
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Integrated digital public healthcare services with smart routing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {serviceCards.map(card => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(card.path)}
                className={`bg-white/40 dark:bg-slate-900/40 rounded-3xl p-6 border border-white/60 dark:border-slate-800/80 backdrop-blur-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group ${card.borderColor}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.gradient} bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 backdrop-blur-sm">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Access Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* QUICK DIAGNOSTIC TESTS RADAR */}
      <div className="bg-white/40 dark:bg-slate-900/40 rounded-3xl p-6 border border-white/50 dark:border-slate-800/60 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              <span>Live Diagnostic Test Availability Radar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quickly filter diagnostic availability across local public healthcare labs
            </p>
          </div>

          <button
            onClick={() => navigate('/care-network/diagnostics')}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <span>Open Diagnostic Map</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {['ECG', 'X-Ray', 'CT Scan', 'MRI', 'Blood Test', 'Ultrasound', 'Pathology'].map(test => (
            <button
              key={test}
              onClick={() => navigate(`/care-network/diagnostics?test=${encodeURIComponent(test)}`)}
              className="px-4 py-2 rounded-2xl text-xs font-bold bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-500/80 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-all backdrop-blur-md shadow-sm active:scale-95"
            >
              ⚡ {test}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CareNetworkDashboard;
