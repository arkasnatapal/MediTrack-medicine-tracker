import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Users, Shield, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import api from '../api/api';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ReportsLibrary from '../components/ReportsLibrary';

const PublicProfile = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { notify } = useNotification();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/auth/public/${memberId}`);
        if (response.data.success) {
          setProfile(response.data.user);
        }
      } catch (err) {
        setError('Invalid Identity Card');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [memberId]);

  const handleInvite = () => {
    if (!currentUser) {
      // Redirect to login with return path
      navigate(`/login?redirect=/identify/${memberId}`);
      return;
    }
    // Mock implementation for now
    notify.success(`Invitation sent to ${profile.name}!`);
  };

    const [doctorCreds, setDoctorCreds] = useState({ id: '', password: '' });
    const [familyOtp, setFamilyOtp] = useState('');
    const [doctorOtp, setDoctorOtp] = useState('');
    const [accessMode, setAccessMode] = useState('doctor'); // 'doctor' | 'family'
    const [otpSent, setOtpSent] = useState(false);
    const [doctorOtpSent, setDoctorOtpSent] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const handleDoctorLogin = async () => {
        // 1. Validate Credentials Client-side (Mock for now, as per original logic)
        if (doctorCreds.id === 'Dooriyan4551' && doctorCreds.password === 'alphajax4551') {
            
            // 2. Request OTP
            try {
                setProcessing(true);
                const response = await api.post('/auth/doctor-access/request-otp', { memberId });
                if (response.data.success) {
                    setDoctorOtpSent(true);
                    notify.success('Access Code sent to patient\'s email');
                }
            } catch (err) {
                notify.error(err.response?.data?.message || 'Failed to send verification code');
            } finally {
                setProcessing(false);
            }

        } else {
            notify.error('Invalid Credentials');
        }
    };

    const handleDoctorBackupOtpRequest = async () => {
        try {
            setProcessing(true);
            const response = await api.post('/auth/doctor-access/request-otp', { memberId, includeFamily: true });
            if (response.data.success) {
                notify.success(response.data.message);
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to send backup codes');
        } finally {
            setProcessing(false);
        }
    };

    const handleDoctorOtpVerify = async () => {
        try {
            const response = await api.post('/auth/doctor-access/verify-otp', { memberId, otp: doctorOtp });
            if (response.data.success) {
                notify.success('Doctor Access Authorized');
                setShowDoctorModal(false);
                setIsAuthorized(true);
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Invalid Access Code');
        }
    };

    const handleFamilyOtpRequest = async () => {
        try {
            setProcessing(true);
            const response = await api.post('/auth/family-access/request-otp', { memberId });
            if (response.data.success) {
                setOtpSent(true);
                notify.success('Access Code sent to registered contacts');
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setProcessing(false);
        }
    };

    const handleFamilyOtpVerify = async () => {
        try {
            const response = await api.post('/auth/family-access/verify-otp', { memberId, otp: familyOtp });
            if (response.data.success) {
                notify.success('Family Access Authorized');
                setShowDoctorModal(false);
                setIsAuthorized(true);
            }
        } catch (err) {
            notify.error(err.response?.data?.message || 'Invalid Access Code');
        }
    };

    // Use data from backend or fallback to empty structure
    const medicalData = profile?.medicalData || {
        summary: "No medical data available.",
        risks: [],
        medicines: [],
        cycleContext: null
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Identity</h1>
            <p className="text-slate-500 dark:text-slate-400">The QR code you scanned does not match any active MediTrack member.</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    // Helper for threat color
    const getThreatColor = (severity) => {
        switch(severity?.toLowerCase()) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-orange-500 text-white';
            case 'low': return 'bg-yellow-500 text-white';
            case 'good': return 'bg-emerald-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-6 px-4 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                 {/* 1. Header Section */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden">
                            <UserAvatar user={profile} className="w-full h-full text-3xl" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full self-center md:self-auto">
                                <Shield className="w-3 h-3" /> Verified Patient
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                ID: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{profile.memberId}</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Gender N/A'}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                {profile.dateOfBirth ? `${new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()} years` : 'Age N/A'}
                            </span>
                        </div>
                    </div>
                 </div>

                 {/* 2. Primary Vitals Grid (Health Score & Threat) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Health Score Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Health Score</h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                        {medicalData.healthScore !== null ? medicalData.healthScore : '--'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ 100</span>
                                </div>
                                <p className={`text-sm font-medium mt-1 ${medicalData.trend === 'improving' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {medicalData.trend ? medicalData.trend.charAt(0).toUpperCase() + medicalData.trend.slice(1) : 'Analyzing...'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full pointer-events-none"></div>
                    </div>

                    {/* Future Threat Prediction (Clickable) */}
                    <div 
                        onClick={() => medicalData.predictedThreat && setShowIntelligenceModal(true)}
                        className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group transition-all ${medicalData.predictedThreat ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600' : ''}`}
                    >
                         <div className="flex items-start justify-between relative z-10">
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projected Risk <span className="text-xs opacity-70 normal-case">(7-14 Days)</span></h3>
                                    {medicalData.predictedThreat && <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                
                                {medicalData.predictedThreat ? (
                                    <>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg mt-3 text-sm font-bold shadow-sm ${getThreatColor(medicalData.predictedThreat.severity)}`}>
                                            <Activity className="w-4 h-4" />
                                            {medicalData.predictedThreat.title || "Stable Projection"}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed line-clamp-2">
                                            {medicalData.predictedThreat.description}
                                        </p>
                                        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium">Click to view detailed analysis</p>
                                    </>
                                ) : (
                                    <div className="mt-3 flex items-center gap-2 text-slate-500">
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                       <span className="text-sm">Calculating forecast...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* 3. Detailed Panels */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Summary & Medications (Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Clinical Summary */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" /> Clinical Snapshot
                            </h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {medicalData.summary}
                                </p>
                            </div>
                        </div>

                        {/* Medications (Moved Here) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Active Medications</h3>
                            {medicalData.medicines && medicalData.medicines.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {medicalData.medicines.map((med, i) => (
                                        <div key={i} className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                                    Rx
                                                </div>
                                                <span className="text-[10px] font-bold bg-white dark:bg-slate-600 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{med.time}</span>
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white text-base line-clamp-1" title={med.name}>{med.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{med.dosage} • {med.freq}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No active medications logged.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Risks & Cycle */}
                    <div className="space-y-6">
                        {/* Risks */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Risk Profile</h3>
                             {medicalData.risks && medicalData.risks.length > 0 ? (
                                <div className="space-y-3">
                                    {medicalData.risks.map((risk, i) => (
                                         <div key={i} className="flex gap-3 items-start">
                                            <Shield className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{risk.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Family History related</p>
                                            </div>
                                         </div>
                                    ))}
                                </div>
                             ) : (
                                <p className="text-sm text-slate-500 italic">No historical risks flagged.</p>
                             )}
                        </div>

                         {/* Cycle Intelligence (Review if Female) */}
                        {profile?.gender === 'female' && medicalData.cycleContext && (
                            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                        <Activity className="w-5 h-5" /> Cycle Status
                                    </h3>
                                    <p className="text-rose-100 text-sm mb-6">Real-time reproductive health tracking</p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Current Phase</p>
                                            <p className="text-2xl font-bold">{medicalData.cycleContext.phase}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Cycle Day</p>
                                            <p className="text-2xl font-bold">{medicalData.cycleContext.day}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center text-sm font-medium">
                                        <span>Next Period Estimate</span>
                                        <span className="bg-white/20 px-3 py-1 rounded-full">{medicalData.cycleContext.nextPeriod}</span>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
                            </div>
                        )}
                    </div>
                 </div>

                    {/* Detailed Intelligence Modal */}
                 {showIntelligenceModal && medicalData.predictedThreat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowIntelligenceModal(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`p-6 ${getThreatColor(medicalData.predictedThreat.severity)} text-white`}>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="w-5 h-5" /> Detailed Health Forensics
                                </h2>
                                <p className="opacity-90 mt-1 text-sm">AI-Driven predictive analysis for {profile.name}</p>
                            </div>
                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Projection</h3>
                                    <p className="text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                        {medicalData.predictedThreat.description}
                                    </p>
                                </div>

                                {medicalData.predictedThreat.reasoning && (
                                    <div className="mb-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Analysis Basis & Patterns</h3>
                                        <ul className="space-y-2">
                                            {medicalData.predictedThreat.reasoning.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {medicalData.predictedThreat.suggestions && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Recommended Clinical Actions</h3>
                                        <div className="space-y-2">
                                            {medicalData.predictedThreat.suggestions.map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                <button 
                                    onClick={() => setShowIntelligenceModal(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                                >
                                    Close Analysis
                                </button>
                            </div>
                        </motion.div>
                    </div>
                 )}

                 {/* Medical Reports Section */}
                 <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <ReportsLibrary memberId={profile.memberId} />
                 </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
            style={{ 
                backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', 
                backgroundSize: '24px 24px' 
            }} 
        />
        <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm md:max-w-4xl relative z-10">
        
        {/* Profile Card */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/50 dark:border-slate-700/50 ring-1 ring-slate-900/5 dark:ring-white/10 md:flex md:flex-row"
        >
            {/* Header / Banner (Left Side on Desktop) */}
            <div className="h-36 md:h-auto md:w-2/5 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 relative overflow-hidden flex flex-col items-center justify-center p-8">
                <div className="absolute inset-0 opacity-30 mix-blend-overlay" 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} 
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
                
                <div className="relative z-10 text-center w-full mt-[-2rem] md:mt-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full border-[6px] border-white dark:border-slate-800 md:border-white/20 shadow-2xl overflow-hidden bg-white mb-4">
                        <UserAvatar user={profile} className="w-full h-full text-3xl" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-white tracking-tight leading-tight">{profile.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 md:text-emerald-100/90 text-sm font-medium mb-4">{profile.email}</p>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 md:bg-white/10 rounded-full border border-emerald-100 dark:border-emerald-900/50 md:border-white/20 backdrop-blur-md">
                        <div className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 md:bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 md:bg-white"></span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 md:text-white uppercase tracking-wide">Active Patient</span>
                    </div>
                </div>
            </div>

            {/* Content (Right Side on Desktop) */}
            <div className="px-6 pb-8 pt-16 md:p-8 md:w-3/5 text-center md:text-left flex flex-col justify-center relative z-10 bg-transparent md:bg-white/50 md:dark:bg-slate-900/50">
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">ID Code</p>
                        <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{profile.memberId}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Member Since</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{new Date(profile.joinDate).getFullYear()}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 md:space-y-4">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleInvite}
                        className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <Users className="w-5 h-5" />
                        <span>Invite to Family</span>
                    </motion.button>
                    
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDoctorModal(true)}
                        className="w-full py-4 px-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white border border-transparent rounded-2xl font-bold shadow-lg shadow-slate-500/10 flex items-center justify-center gap-2 transition-all"
                    >
                        <Activity className="w-5 h-5" />
                        <span>View Records</span>
                    </motion.button>
                </div>
                 {/* Security Footer - Integrated in Right Side for Desktop */}
                 <div className="mt-8 flex items-center justify-center md:justify-start gap-2 text-slate-400 text-[10px] uppercase tracking-widest font-bold opacity-60">
                    <Shield className="w-3 h-3" />
                    <span>Verified MediTrack Identity &trade;</span>
                </div>
            </div>
            
        </motion.div>
      </div>

      {/* Doctor Login Modal */}
      <AnimatePresence>
        {showDoctorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    onClick={() => setShowDoctorModal(false)}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-white/20 dark:border-slate-700"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                            <KeyRound className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Access Records</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Authentication required for privacy.</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setAccessMode('doctor')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${accessMode === 'doctor' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Doctor
                        </button>
                        <button
                            onClick={() => setAccessMode('family')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${accessMode === 'family' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Family
                        </button>
                    </div>

                    {accessMode === 'doctor' ? (
                        <div className="space-y-5">
                            {!doctorOtpSent ? (
                                <>
                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Medical License ID</label>
                                            <input 
                                                type="text" 
                                                value={doctorCreds.id}
                                                onChange={(e) => setDoctorCreds({...doctorCreds, id: e.target.value})}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-semibold text-slate-900 dark:text-white placeholder:text-slate-400" 
                                                placeholder="Enter ID"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Password</label>
                                            <input 
                                                type="password" 
                                                value={doctorCreds.password}
                                                onChange={(e) => setDoctorCreds({...doctorCreds, password: e.target.value})}
                                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-semibold text-slate-900 dark:text-white placeholder:text-slate-400" 
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleDoctorLogin}
                                        disabled={processing}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 mt-2"
                                    >
                                        {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Authorize Access'}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-6">
                                     <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">i</span>
                                        </div>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 leading-snug">Verification code sent to patient's registered email.</p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block text-center">Enter Access Code</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={doctorOtp}
                                                onChange={(e) => setDoctorOtp(e.target.value)}
                                                className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-center tracking-[0.5em] text-2xl font-mono font-bold text-slate-800 dark:text-white" 
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <button 
                                            onClick={handleDoctorOtpVerify}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                                        >
                                            Verify & Access Records
                                        </button>
                                        
                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold">Or</span></div>
                                        </div>

                                        <button 
                                            onClick={handleDoctorBackupOtpRequest}
                                            disabled={processing}
                                            className="w-full py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Users className="w-4 h-4" />
                                            {processing ? 'Sending...' : 'Send to Linked Family'}
                                        </button>
                                    </div>

                                     <button 
                                        onClick={() => setDoctorOtpSent(false)}
                                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!otpSent ? (
                                <div className="text-center py-2">
                                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                            To ensure privacy, we will send a one-time verification code to all linked <span className="font-bold text-slate-700 dark:text-slate-200">family members</span> and <span className="font-bold text-slate-700 dark:text-slate-200">emergency contacts</span>.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleFamilyOtpRequest}
                                        disabled={processing}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5"/> Request Access Code</>}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                                        </div>
                                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-snug">Security code sent to all linked contacts.</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block text-center">Enter Access Code</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={familyOtp}
                                                onChange={(e) => setFamilyOtp(e.target.value)}
                                                className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-center tracking-[0.5em] text-2xl font-mono font-bold text-slate-800 dark:text-white" 
                                                placeholder="000000"
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleFamilyOtpVerify}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                                    >
                                        Verify & Unlock
                                    </button>
                                    
                                    <button 
                                        onClick={() => setOtpSent(false)}
                                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        Send New Code
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfile;
