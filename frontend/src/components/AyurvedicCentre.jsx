import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Wind, Flame, Droplets, ArrowRight, Check, Activity, Moon, Sun, Sprout, Sparkles, Info, Clock, ShieldCheck, RefreshCw, Bell, Calendar, Trash2, X, CheckSquare, Square, Coffee, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Components
const DoshaCard = ({ type, score, primary }) => {
  const [showInfo, setShowInfo] = useState(false);

  const colors = {
    vata: 'from-blue-50 to-indigo-50 text-indigo-900 border-indigo-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:bg-slate-800/50 dark:text-blue-100 dark:border-indigo-500/50 dark:shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]',
    pitta: 'from-orange-50 to-red-50 text-orange-900 border-orange-200 dark:from-orange-900/20 dark:to-red-900/20 dark:bg-slate-800/50 dark:text-orange-100 dark:border-orange-500/50 dark:shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]',
    kapha: 'from-emerald-50 to-green-50 text-emerald-900 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:bg-slate-800/50 dark:text-emerald-100 dark:border-emerald-500/50 dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]',
  };
  
  const icons = {
    vata: <Wind className="w-6 h-6" />,
    pitta: <Flame className="w-6 h-6" />,
    kapha: <Droplets className="w-6 h-6" />,
  };

  const descriptions = {
    vata: "Governs movement and communication. Associated with air and space elements.",
    pitta: "Governs digestion and metabolism. Associated with fire and water elements.",
    kapha: "Governs structure and lubrication. Associated with earth and water elements."
  };

  const isPrimary = type && primary && type.toLowerCase() === primary.toLowerCase();
  const safeType = type ? type.toLowerCase() : 'vata';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative p-6 rounded-2xl border backdrop-blur-xl ${colors[safeType]} bg-gradient-to-br flex flex-col items-center justify-center gap-4 shadow-sm transition-all duration-300 group`}
    >
      <div className="absolute top-4 right-4 z-20">
         <button 
            className="opacity-50 hover:opacity-100 transition-opacity p-1"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo(!showInfo)}
         >
            <Info size={16} />
         </button>
         
         <AnimatePresence>
            {showInfo && (
                <motion.div 
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs p-3 rounded-xl shadow-xl z-50 border border-slate-200 dark:border-slate-700 pointer-events-none"
                >
                    <p className="font-medium leading-relaxed">
                        {descriptions[safeType]}
                    </p>
                    <div className="absolute -top-1 right-2 w-2 h-2 bg-white dark:bg-slate-900 border-t border-l border-slate-200 dark:border-slate-700 transform rotate-45" />
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      {isPrimary && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-10 box-decoration-clone">
          <Sparkles size={12} /> Dominant
        </div>
      )}
      <div className={`p-4 rounded-full bg-white/80 dark:bg-white/10 shadow-sm backdrop-blur-md border border-white/20 dark:border-white/10`}>
        {icons[safeType]}
      </div>
      <div className="text-center">
         <h3 className="font-bold text-xl capitalize mb-1">{type}</h3>
         <span className="text-xs font-medium opacity-80 uppercase tracking-widest">Constitution</span>
      </div>
      
      <div className="w-full bg-black/5 dark:bg-white/10 h-3 rounded-full overflow-hidden mt-1">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-current opacity-90 rounded-full`}
        />
      </div>
      <span className="text-sm font-bold opacity-90">{score}%</span>
    </motion.div>
  );
};

const AyurvedicCentre = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedback, setFeedback] = useState({
    mood: 'Neutral',
    energyLevel: 5,
    digestion: 'Normal',
    symptoms: '',
    cycleDay: ''
  });
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!profile?.dailySuggestion?.validUntil) return;
    
    const updateTimer = () => {
        const end = new Date(profile.dailySuggestion.validUntil).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff <= 0) {
            setTimeLeft(null);
        } else {
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${h}h ${m}m`);
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderStep, setReminderStep] = useState(1); // 1: Select, 2: Routine, 3: Loading, 4: Review
  const [userRoutine, setUserRoutine] = useState({
      wake: "06:00",
      lunch: "13:00",
      dinner: "20:00",
      sleep: "22:00"
  });
  const [scheduledReminders, setScheduledReminders] = useState([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [reminderTab, setReminderTab] = useState('setup');

  const allReminderOptions = React.useMemo(() => {
     if (!profile) return [];
     const options = [];

     // Healing Path
     profile.healingPath?.recommendations?.forEach(rec => {
         options.push({
             title: rec.title,
             category: rec.category?.type || rec.category || 'Healing Path',
             instruction: rec.content,
             source: 'Intelligence',
             sourceColor: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300',
             time: rec.timeToPerform || '20 mins'
         });
     });

     // Genetic Insights
     profile.geneticInsights?.forEach(gen => {
         options.push({
             title: `Safeguard: ${gen.condition}`,
             category: 'Genetic',
             instruction: gen.recommendation,
             source: 'Genetic',
             sourceColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300',
             time: 'Daily'
         });
     });

     // Daily Yoga (Object)
     if (profile.dailySuggestion?.content?.yoga) {
         const yoga = profile.dailySuggestion.content.yoga;
         if (Array.isArray(yoga)) {
             yoga.forEach(y => {
                const label = typeof y === 'string' ? y : y.name;
                const desc = typeof y === 'string' ? y : y.benefits;
                options.push({
                    title: label?.split(':')[0]?.replace(/\*\*/g, '') || 'Daily Yoga',
                    category: 'Yoga',
                    instruction: desc?.replace(/\*\*/g, '') || '',
                    source: 'Daily',
                    sourceColor: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300',
                    time: '15 mins'
                });
             });
         } else if (typeof yoga === 'object') {
             options.push({
                 title: yoga.name || 'Daily Yoga',
                 category: 'Yoga',
                 instruction: yoga.benefits || 'Practice daily for better health',
                 source: 'Daily',
                 sourceColor: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300',
                 time: '15 mins'
             });
         }
     }
     
     // Daily Lifestyle
     if (Array.isArray(profile.dailySuggestion?.content?.lifestyle)) {
        profile.dailySuggestion.content.lifestyle.forEach(l => {
            options.push({
                title: l.split(':')[0]?.replace(/\*\*/g, '') || 'Lifestyle Habit', 
                category: 'Lifestyle',
                instruction: l.replace(/\*\*/g, ''),
                source: 'Daily',
                sourceColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
                time: 'Daily'
            });
        });
     }

     return options;
  }, [profile]);

  const handleGenerateSchedule = async () => {
      setReminderStep(3);
      try {
          const selectedItems = selectedRecommendations.map(i => allReminderOptions[i]);
          const token = localStorage.getItem('token');
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/reminders/schedule`, {
              routine: userRoutine,
              reminders: selectedItems
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setScheduledReminders(res.data);
          setReminderStep(4);
      } catch (err) {
          console.error("Scheduling failed", err);
          setReminderStep(2); 
      }
  };

  const handleSyncReminders = async () => {
    setLoading(true);
    try {
        let payloadReminders = [];
        if (reminderStep === 4) {
             payloadReminders = scheduledReminders.map(r => ({
                 title: r.title,
                 type: r.category,
                 instruction: r.instruction,
                 time: r.scheduledTime, 
                 durationDays: 3
             }));
        } 

        const payload = { reminders: payloadReminders };
        const token = localStorage.getItem('token');
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/reminders/sync`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
        setShowReminderModal(false);
        setSelectedRecommendations([]);
        setScheduledReminders([]);
        setReminderStep(1);
        setReminderTab('active');
    } catch (err) {
        console.error("Sync failed", err);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
        setDeletingId(reminderId);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/ayurvedic/reminders/${reminderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setDeletingId(null);
        }
    }
  };



  const toggleSelection = (idx) => {
      if (selectedRecommendations.includes(idx)) {
          setSelectedRecommendations(selectedRecommendations.filter(i => i !== idx));
      } else {
          setSelectedRecommendations([...selectedRecommendations, idx]);
      }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/ayurvedic`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch ayurvedic profile", err);
      setLoading(false); 
      // Keep loading false so we can show empty state or error if needed
      // But typically we don't block the UI if API fails, just show partial data
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/regenerate`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
        setLoading(false);
    } catch (err) {
        console.error("Failed to regenerate", err);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Construct payload
      const payload = {
          mood: feedback.mood,
          energyLevel: feedback.energyLevel,
          digestion: feedback.digestion,
          symptoms: feedback.symptoms ? feedback.symptoms.split(',').map(s => s.trim()) : [],
      };
      // Only add cycle data if valid
      if(user?.gender === 'female' && feedback.cycleDay) {
          // Simplified cycle tracking for now
          // In a real app we'd calculate dates. 
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ayurvedic/feedback`, payload, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setFeedbackMode(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Hero Section with Parallax-like vibe */}
      <div className="relative overflow-hidden bg-emerald-50 dark:bg-emerald-900 text-emerald-900 dark:text-white rounded-b-[3rem] shadow-2xl transition-colors duration-300">
        <div className="absolute inset-0 text-emerald-900/5 dark:text-white/10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <Leaf className="w-16 h-16 mx-auto mb-6 text-emerald-600 dark:text-emerald-300" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4 font-serif tracking-tight text-emerald-900 dark:text-white">
                    Natural Healing Sanctuary
                </h1>
                <p className="text-xl text-emerald-700 dark:text-emerald-100 max-w-2xl mx-auto">
                    Harmony of Body, Mind, and Spirit. Personalized Ayurvedic wisdom updated daily based on your rhythm.
                </p>
            </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 pb-20 relative z-20">
        {/* Dosha Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <DoshaCard type="Vata" score={profile?.constituency?.vata || 0} primary={profile?.constituency?.primary} />
            <DoshaCard type="Pitta" score={profile?.constituency?.pitta || 0} primary={profile?.constituency?.primary} />
            <DoshaCard type="Kapha" score={profile?.constituency?.kapha || 0} primary={profile?.constituency?.primary} />
        </div>

        {/* Healing Path Widget (Powered by Intelligence) - Horizontal */}
        {profile?.healingPath && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900 dark:to-emerald-900 text-teal-900 dark:text-white rounded-3xl p-8 shadow-xl relative overflow-hidden mb-12 border border-teal-100 dark:border-teal-800"
            >
                 {/* Header */}
                 <div className="relative z-10 mb-8 text-center">
                    <button 
                         onClick={() => setShowReminderModal(true)}
                         className="absolute right-0 top-0 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 text-teal-800 dark:text-white p-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm backdrop-blur-sm z-20"
                         title="Setup AI Reminders"
                    >
                         <Calendar size={18} />
                         <span className="text-xs font-bold hidden md:block">Set Reminders</span>
                         {profile.activeReminders?.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-black rounded-full" />
                         )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-xs mb-2">
                        <ShieldCheck size={16} /> INTELLIGENCE PREDICTION
                    </div>
                    <h3 className="text-3xl font-bold font-serif mb-2">{profile.healingPath.title}</h3>
                    <p className="text-lg text-teal-700 dark:text-emerald-100/80 max-w-2xl mx-auto italic">
                        "{profile.healingPath.description}"
                    </p>
                 </div>

                 {/* Recommendations Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {profile.healingPath.recommendations?.map((rec, i) => (
                        <div key={i} className="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-100 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all hover:-translate-y-1 group shadow-sm">
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/30 shrink-0">
                                    {rec.category?.type || rec.category}
                                </span>
                                {rec.timeToPerform && (
                                    <span className="text-xs flex items-start gap-1.5 text-emerald-600 dark:text-emerald-200/80 font-medium text-right leading-tight max-w-[60%]">
                                        <Clock size={12} className="mt-0.5 shrink-0" /> 
                                        {rec.timeToPerform}
                                    </span>
                                )}
                            </div>
                            <h4 className="font-bold text-xl mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{rec.title}</h4>
                            <p className="text-sm text-teal-700 dark:text-emerald-50/90 leading-relaxed">
                                {rec.content}
                            </p>
                        </div>
                    ))}
                 </div>
                 
                 {/* Abstract background elements */}
                 <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                 <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/20 blur-3xl rounded-full -ml-20 -mb-20 pointer-events-none" />
            </motion.div>
        )}

        {/* Daily Wisdom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Suggestion */}
            <div className="lg:col-span-2 space-y-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-emerald-100 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                                Today's Focus
                                <button 
                                    onClick={handleRegenerate}
                                    disabled={loading}
                                    title="Regenerate Plan"
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800 rounded-lg transition-colors text-emerald-700 dark:text-emerald-300 disabled:opacity-50"
                                >
                                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                </button>
                            </span>
                            <h2 className="text-3xl font-serif text-slate-800 dark:text-white mt-1">
                                {profile?.dailySuggestion?.content?.focus || "Finding Balance"}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                             <Sun className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Quote */}
                    <blockquote className="border-l-4 border-emerald-300 pl-4 italic text-slate-600 dark:text-slate-400 mb-8">
                        "{profile?.dailySuggestion?.content?.quote || "When diet is wrong, medicine is of no use. When diet is correct, medicine is of no need."}"
                    </blockquote>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl">
                             <h4 className="flex items-center gap-2 font-bold text-orange-800 dark:text-orange-300 mb-3">
                                <Sprout className="w-5 h-5" /> Diet Recommendation
                             </h4>
                             <ul className="space-y-2">
                                {Array.isArray(profile?.dailySuggestion?.content?.diet) && profile.dailySuggestion.content.diet.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <Check className="w-4 h-4 mt-0.5 text-orange-500" />
                                        {item}
                                    </li>
                                ))}
                             </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl">
                             <h4 className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 mb-3">
                                <Activity className="w-5 h-5" /> Lifestyle & Yoga
                             </h4>
                             <p className="font-semibold text-slate-800 dark:text-white mb-2">
                                {profile?.dailySuggestion?.content?.yoga?.name}
                             </p>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {profile?.dailySuggestion?.content?.yoga?.benefits}
                             </p>
                             <div className="space-y-2">
                                {Array.isArray(profile?.dailySuggestion?.content?.lifestyle) && profile.dailySuggestion.content.lifestyle.slice(0, 2).map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                                        {item}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Herbs Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-6"
                >
                     <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5" /> Recommended Herbs
                     </h3>
                     <div className="space-y-3">
                        {Array.isArray(profile?.dailySuggestion?.content?.herbs) && profile.dailySuggestion.content.herbs.map((herb, i) => {
                            const parts = herb.match(/\*\*(.*?)\*\*:?\s*(.*)/);
                            if (parts) {
                                return (
                                    <div key={i} className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 backdrop-blur-sm flex items-start gap-4 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80">
                                        <div className="mt-1 p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 dark:text-emerald-400">
                                             <Leaf size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-base mb-1">
                                                {parts[1]}
                                            </h4>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {parts[2] || herb.replace(/\*\*(.*?)\*\*:?\s*/, '')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            // Fallback for simple strings
                            return (
                                <div key={i} className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-emerald-600 dark:text-emerald-400">
                                         <Leaf size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                                        {herb.replace(/\*\*/g, '')}
                                    </span>
                                </div>
                            );
                        })}
                     </div>
                </motion.div>
            </div>

            {/* Daily Check-in Side Panel */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Daily Check-in</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Update us on how you feel. Your healing plan refreshes every 24 hours based on this.
                    </p>
                    
                    {!feedbackMode ? (
                        timeLeft ? (
                           <div className="w-full py-4 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-xl font-medium text-center border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 cursor-not-allowed select-none transition-colors">
                               <span className="text-xs uppercase tracking-widest font-bold opacity-70">Next Update In</span>
                               <span className="text-xl font-mono font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                                   <Clock className="inline w-5 h-5 -mt-1 mr-2 opacity-60" />
                                   {timeLeft}
                               </span>
                           </div>
                        ) : (
                            <button 
                               onClick={() => setFeedbackMode(true)}
                               className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" /> Update Status
                            </button>
                        )
                    ) : (
                        <form onSubmit={handleSubmitFeedback} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Energy Level (1-10)</label>
                                <input 
                                    type="range" 
                                    min="1" max="10" 
                                    value={feedback.energyLevel}
                                    onChange={e => setFeedback({ ...feedback, energyLevel: e.target.value })}
                                    className="w-full accent-emerald-500"
                                />
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Low</span>
                                    <span>High</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mood</label>
                                <select 
                                    value={feedback.mood}
                                    onChange={e => setFeedback({ ...feedback, mood: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm"
                                >
                                    <option>Calm</option>
                                    <option>Anxious</option>
                                    <option>Irritated</option>
                                    <option>Lethargic</option>
                                    <option>Happy</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Digestion</label>
                                <select 
                                    value={feedback.digestion}
                                    onChange={e => setFeedback({ ...feedback, digestion: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm"
                                >
                                    <option>Normal</option>
                                    <option>Bloated</option>
                                    <option>Constipated</option>
                                    <option>Heavy</option>
                                    <option>Hungry</option>
                                </select>
                            </div>

                            {user?.gender === 'female' && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cycle Day (Optional)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Day 1-28"
                                        value={feedback.cycleDay}
                                        onChange={e => setFeedback({ ...feedback, cycleDay: e.target.value })}
                                        className="w-full p-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm"
                                    />
                                </div>
                            )}

                             <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackMode(false)}
                                    className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                                >
                                    Save
                                </button>
                             </div>
                        </form>
                    )}
                </div>

                {/* Genetic Prevention Widget */}
                {/* Genetic Prevention Widget */}
                {/* Genetic Prevention Widget */}
                {profile?.geneticInsights && profile.geneticInsights.length > 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900 dark:to-violet-900 text-indigo-900 dark:text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-indigo-100 dark:border-indigo-800 h-full flex flex-col">
                        <div className="relative z-10 flex-1 flex flex-col">
                            <h4 className="font-bold flex items-center gap-3 mb-6 text-lg text-indigo-900 dark:text-indigo-100">
                                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 shadow-sm">
                                    <Activity size={18} />
                                </div>
                                Genetic Safeguard
                            </h4>
                            <div className="space-y-3 overflow-y-auto pr-2 -mr-2 custom-scrollbar flex-1 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-indigo-200 dark:[&::-webkit-scrollbar-thumb]:bg-indigo-700 [&::-webkit-scrollbar-track]:bg-transparent">
                                {profile.geneticInsights.map((insight, idx) => (
                                    <div key={idx} className="bg-white/80 dark:bg-indigo-950/40 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800/50 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                            <h5 className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-1 rounded-md leading-relaxed shadow-sm">
                                                {insight.condition}
                                            </h5>
                                            <span className="text-[10px] font-semibold opacity-80 border border-indigo-200 dark:border-indigo-700/50 px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-300 whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/20">
                                                {insight.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium pl-1 border-l-2 border-indigo-200 dark:border-indigo-700">
                                            &nbsp;{insight.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Sparkles className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/10 dark:text-indigo-500/20 rotate-12 pointer-events-none" />
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900 dark:to-violet-900 text-indigo-900 dark:text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-indigo-100 dark:border-indigo-800">
                        <div className="relative z-10">
                            <h4 className="font-bold mb-2">Genetic Insights</h4>
                             <p className="text-indigo-700 dark:text-indigo-200 text-sm mb-4">
                                Update your family history in settings to receive personalized genetic safeguards.
                             </p>
                             <button
                                onClick={() => navigate('/settings')}
                                className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white px-3 py-1.5 rounded-lg transition-colors"
                             >
                                Update Profile
                             </button>
                        </div>
                        <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-800 opacity-10 dark:opacity-50" />
                    </div>
                )}


            </div>
        </div>
      </div>
      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> AI Health Reminders
                            </h3>
                            <p className="text-xs text-emerald-100 mt-1">
                                Sync your healing path with your daily schedule
                            </p>
                        </div>
                        <button onClick={() => setShowReminderModal(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setReminderTab('setup')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors ${reminderTab === 'setup' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            Setup New
                        </button>
                        <button 
                            onClick={() => setReminderTab('active')}
                            className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${reminderTab === 'active' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            Active Reminders
                            {profile?.activeReminders?.length > 0 && (
                                <span className="bg-emerald-100 dark:bg-emerald-800 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
                                    {profile.activeReminders.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Content */}
     <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {reminderTab === 'setup' ? (
                            <div className="space-y-6">
                                {/* Step 1: Selection */}
                                {reminderStep === 1 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="mb-4">
                                             <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">Select Habits</h4>
                                             <p className="text-sm text-slate-500">Choose the activities you want to build into your routine.</p>
                                        </div>
                                        <div className="space-y-3">
                                            {allReminderOptions.map((rec, i) => (
                                                <div 
                                                    key={i}
                                                    onClick={() => toggleSelection(i)}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${selectedRecommendations.includes(i) ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md transform scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className={`mt-1 p-0.5 rounded ${selectedRecommendations.includes(i) ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-500 text-transparent'}`}>
                                                        <Check size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight mb-1">{rec.title}</h5>
                                                            {rec.source && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ml-2 ${rec.sourceColor || 'bg-slate-100 text-slate-500'}`}>
                                                                    {rec.source}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                                            {rec.instruction}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                                                {rec.category}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <Clock size={10} /> {rec.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Routine Input */}
                                {reminderStep === 2 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="mb-6">
                                             <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">The Rhythm of Your Day</h4>
                                             <p className="text-sm text-slate-500">Tell us your schedule so AI can find the perfect time slots.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Sun size={14} className="text-orange-400"/> Wake Up</label>
                                                <input type="time" value={userRoutine.wake} onChange={e => setUserRoutine({...userRoutine, wake: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Utensils size={14} className="text-orange-600"/> Lunch</label>
                                                <input type="time" value={userRoutine.lunch} onChange={e => setUserRoutine({...userRoutine, lunch: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Coffee size={14} className="text-amber-700"/> Dinner</label>
                                                <input type="time" value={userRoutine.dinner} onChange={e => setUserRoutine({...userRoutine, dinner: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Moon size={14} className="text-indigo-400"/> Sleep</label>
                                                <input type="time" value={userRoutine.sleep} onChange={e => setUserRoutine({...userRoutine, sleep: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Loading */}
                                {reminderStep === 3 && (
                                    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500 text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                                            <Sparkles className="w-16 h-16 text-emerald-500 animate-spin-slow" />
                                        </div>
                                        <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">Orchestrating Your Wellness</h4>
                                        <p className="text-slate-500 max-w-xs mx-auto">Aligning tasks with your biological clock and planetary hours...</p>
                                    </div>
                                )}

                                {/* Step 4: Review */}
                                {reminderStep === 4 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="mb-4">
                                             <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">Your Harmonized Schedule</h4>
                                             <p className="text-sm text-slate-500">AI has optimized these times. Adjust if needed.</p>
                                        </div>
                                        <div className="space-y-3 pb-4">
                                            {scheduledReminders.map((rem, i) => (
                                                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rem.title}</h5>
                                                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                                                            {rem.scheduledTime}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 italic border-l-2 border-emerald-300 pl-2">
                                                        "{rem.reason}"
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                                        <Clock size={12} className="text-slate-400" />
                                                        <input 
                                                            type="time" 
                                                            value={rem.scheduledTime}
                                                            onChange={(e) => {
                                                                const newReminders = [...scheduledReminders];
                                                                newReminders[i].scheduledTime = e.target.value;
                                                                setScheduledReminders(newReminders);
                                                            }}
                                                            className="text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 font-mono focus:text-emerald-600"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profile?.activeReminders?.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No active reminders found.</p>
                                    </div>
                                ) : (
                                    profile?.activeReminders?.map((rem) => (
                                        <div key={rem._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center group">
                                            <div>
                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rem.title}</h5>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">
                                                        {rem.scheduledTime}
                                                    </span>
                                                    <span>
                                                        {rem.durationDays} Days left
                                                    </span>
                                                    {rem.googleEventId && (
                                                        <span className="flex items-center gap-1 text-blue-500" title="Synced with Google Calendar">
                                                            <Calendar size={10} /> Synced
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteReminder(rem._id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Reminder"
                                                disabled={deletingId === rem._id}
                                            >
                                                {deletingId === rem._id ? <RefreshCw size={18} className="animate-spin text-red-500" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {reminderTab === 'setup' && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                             {reminderStep > 1 && (
                                 <button 
                                    onClick={() => setReminderStep(prev => prev - 1)}
                                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 text-sm font-medium px-4 py-2"
                                    disabled={reminderStep === 3}
                                 >
                                    Back
                                 </button>
                             )}
                             <div className="flex-1"></div>
                             
                             {reminderStep === 1 && (
                                 <button 
                                     onClick={() => setReminderStep(2)}
                                     disabled={selectedRecommendations.length === 0}
                                     className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                 >
                                     Configure Rhythm <ArrowRight size={16} />
                                 </button>
                             )}
                             
                             {reminderStep === 2 && (
                                 <button 
                                     onClick={handleGenerateSchedule}
                                     className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
                                 >
                                     <Sparkles size={16} /> AI Orchestration
                                 </button>
                             )}

                             {reminderStep === 4 && (
                                 <button 
                                     onClick={handleSyncReminders}
                                     disabled={loading}
                                     className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                 >
                                     {loading ? <RefreshCw size={18} className="animate-spin" /> : <Calendar size={18} />}
                                     Sync to Calendar
                                 </button>
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

export default AyurvedicCentre;
