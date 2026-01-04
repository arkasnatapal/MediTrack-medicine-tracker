import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Users, Shield, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import api from '../api/api';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

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
    const [isAuthorized, setIsAuthorized] = useState(false);

    const handleDoctorLogin = () => {
        if (doctorCreds.id === 'Dooriyan4551' && doctorCreds.password === 'alphajax4551') {
            notify.success('Doctor Access Authorized');
            setShowDoctorModal(false);
            setIsAuthorized(true);
        } else {
            notify.error('Invalid Credentials');
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
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        
        {/* Profile Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        >
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" 
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%)' }} 
                />
            </div>

            <div className="px-8 pb-8 -mt-16 text-center relative z-10">
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white">
                    <UserAvatar user={profile} className="w-full h-full text-4xl" />
                </div>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{profile.email}</p>
                    
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full border border-slate-200 dark:border-slate-600">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Health Status: Active</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Member ID</p>
                        <p className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 mt-1">{profile.memberId}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Joined</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">{new Date(profile.joinDate).getFullYear()}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-3">
                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={handleInvite}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        Invite to Family
                    </motion.button>
                    
                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDoctorModal(true)}
                        className="w-full py-3.5 px-4 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Activity className="w-5 h-5" />
                        View Detailed Analysis
                    </motion.button>
                </div>
            </div>
            
             {/* Security Footer */}
             <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Shield className="w-3 h-3" />
                <span>Verified MediTrack Identity</span>
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
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowDoctorModal(false)}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <KeyRound className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Doctor Access</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please authenticate to view detailed medical records.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Medical License ID / Email</label>
                            <input 
                                type="text" 
                                value={doctorCreds.id}
                                onChange={(e) => setDoctorCreds({...doctorCreds, id: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
                            <input 
                                type="password" 
                                value={doctorCreds.password}
                                onChange={(e) => setDoctorCreds({...doctorCreds, password: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500" 
                            />
                        </div>
                        <button 
                            onClick={handleDoctorLogin}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
                        >
                            Authorize Access
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicProfile;
