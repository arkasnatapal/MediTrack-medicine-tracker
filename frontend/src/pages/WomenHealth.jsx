import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Droplet, Heart, Info, ShieldCheck, Moon, Sun, Wind, Brain, Activity, Plus, 
    ArrowRight, Check, X, Clock, History, AlertTriangle, Sparkles, Loader2
} from 'lucide-react';

import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { 
    differenceInDays, addDays, format, isPast, formatDistanceToNow,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
    addMonths, subMonths, isSameMonth, isSameDay, getDate
} from 'date-fns';

const WomenHealth = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [logOpen, setLogOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    
    // Inputs
    const [estimateDate, setEstimateDate] = useState('');
    const [logSymptoms, setLogSymptoms] = useState([]);
    const [logMood, setLogMood] = useState("");
    const [logFlow, setLogFlow] = useState("");
    const [logPain, setLogPain] = useState(0);
    const [logNotes, setLogNotes] = useState("");
    const [logPainAreas, setLogPainAreas] = useState([]); // New State
    const [logEnergy, setLogEnergy] = useState("Medium"); // New Energy State
    
    // Detailed Exercise View State
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [feedbackGivenToday, setFeedbackGivenToday] = useState([]); // New Feedback State

    useEffect(() => {
        if (user && user.gender !== 'female') navigate('/dashboard');
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/women-health/${id || user._id}`);
            setData(res.data);
            if (res.data?.feedbackGivenToday) setFeedbackGivenToday(res.data.feedbackGivenToday);
        } catch (error) {
            console.error("Error fetching WHI data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchData();
    }, [id, user]);

    // Actions
    const handleSetEstimate = async () => {
        if (!estimateDate) return;
        try {
            await api.post(`/women-health/${user._id}/estimate-date`, { date: estimateDate });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleConfirmStart = async () => {
        try {
            await api.post(`/women-health/${user._id}/cycle-start-confirm`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleStopCycle = async () => {
        try {
            await api.post(`/women-health/${user._id}/cycle-stop`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const submitDailyLog = async () => {
        try {
            // Validation: Ensure energy is picked
            if (!logEnergy) {
                alert("Please select your energy level.");
                return;
            }

            const res = await api.post(`/women-health/${user._id}/log`, {
                date: new Date(),
                flow: logFlow,
                mood: logMood,
                pain: logPain,
                painAreas: logPainAreas, // Send to backend
                energyLevel: (logEnergy || "Medium").toLowerCase(), // Send Energy Safe
                notes: logNotes // Send Notes
            });

            setData(res.data);
            setLogOpen(false);
            // Reset Form
            setLogFlow(null);
            setLogMood(null);
            setLogPain(0);
            setLogPainAreas([]);
            setLogEnergy(null);
            setLogNotes("");
            
        } catch (error) {
            console.error("Log Error", error);
        }
    };

    const handleFeedback = async (rating) => {
        if (!selectedExercise) return;
        try {
            await api.post('/women-health/feedback', {
                exerciseName: selectedExercise.name,
                rating
            });
            // Visual confirmation
            // alert("Thanks! We'll use this to improve your recommendations."); // Removed alert for smoother UI
            
            // Block further feedback for this specific exercise
            setFeedbackGivenToday(prev => [...prev, selectedExercise.name]);
            
            // setSelectedExercise(null); // Keep modal open to read steps if they want
        } catch (error) {
            console.error("Feedback error", error);
        }
    };
    
    const togglePainArea = (area) => {
        setLogPainAreas(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    if (!user || user.gender !== 'female') return null;

    if (loading) return (
        <div className="min-h-screen bg-rose-50 dark:bg-[#020617] flex flex-col gap-3 items-center justify-center text-rose-500 font-medium">
            <Loader2 className="w-8 h-8 animate-spin" />
            Synced & Encrypted...
        </div>
    );

    const cycleData = data?.data?.cycleData || {};
    const analysis = data?.analysis || {};
    
    // Determine View State
    const isPeriodActive = cycleData.isPeriodActive;
    const nextEstimate = cycleData.nextEstimatedStartDate;
    
    // Explicitly check for valid string 'null' or null object from backend
    const hasEstimate = nextEstimate && nextEstimate !== "null";
    
    // Waiting Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    let daysUntil = null;
    let isOverdue = false;

    if (hasEstimate) {
        const estimate = new Date(nextEstimate);
        estimate.setHours(0, 0, 0, 0);
        daysUntil = differenceInDays(estimate, today);
        isOverdue = daysUntil <= 0; // 0 means today, < 0 means past
    }

    // Chart Data (Visual Standard: 28 days, or current day if longer)
    const backendCycleLength = cycleData.cycleLength || 28;
    const effectiveCycleLength = Math.max(backendCycleLength, 28);
    const cycleDay = analysis.cycleDay || 1;
    const visualLength = Math.max(cycleDay + 5, effectiveCycleLength); // Show at least 28 (or effective), or current + buffer
    
    const chartData = [];
    for (let i = 1; i <= visualLength; i++) {
        let intensity = 50;
        if (i <= 5) intensity = 30; // Menstrual
        else if (i <= 13) intensity = 70; // Follicular
        else if (i <= 15) intensity = 100; // Ovulation
        else intensity = 60; // Luteal
        chartData.push({ day: i, intensity });
    }

    // Check-in Lockout Logic
    let isCheckinLocked = false;
    let timeRemaining = "";
    
    const logs = data?.data?.dailyLogs || [];
    if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        const lastLogTime = new Date(lastLog.date).getTime();
        const nowTime = new Date().getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (nowTime - lastLogTime < twentyFourHours) {
            isCheckinLocked = true;
            const remaining = twentyFourHours - (nowTime - lastLogTime);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${hours}h ${minutes}m`;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] text-slate-800 dark:text-slate-200 pb-20 relative">
            
             {/* Log Modal */}
             <AnimatePresence>
                {logOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setLogOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 dark:border-rose-900/30"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Daily Check-in</h2>
                                    <p className="text-white/80 opacity-90">Log your symptoms for better AI insights.</p>
                                </div>
                                <button onClick={() => setLogOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Mood */}
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wider">Mood</label>
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                                            value={logMood}
                                            onChange={(e) => setLogMood(e.target.value)}
                                        >
                                            <option value="">Select Mood</option>
                                            <option value="Happy">Happy / Energetic</option>
                                            <option value="Calm">Calm</option>
                                            <option value="Irritable">Irritable / PMS</option>
                                            <option value="Sad">Sad / Low</option>
                                            <option value="Anxious">Anxious</option>
                                        </select>
                                    </div>
                                    
                                    {/* Bleeding */}
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wider">Bleeding Flow</label>
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                                            value={logFlow}
                                            onChange={(e) => setLogFlow(e.target.value)}
                                        >
                                             <option value="">Select Flow</option>
                                             <option value="None">None</option>
                                             <option value="Light">Light</option>
                                             <option value="Medium">Medium</option>
                                             <option value="Heavy">Heavy</option>
                                             <option value="Spotting">Spotting</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Pain Intensity */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 block uppercase tracking-wider justify-between">
                                        <span>Pain Level</span>
                                        <span className={`text-lg font-bold ${logPain > 7 ? 'text-red-500' : logPain > 4 ? 'text-orange-500' : 'text-emerald-500'}`}>{logPain}/10</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="10" 
                                        step="1"
                                        value={logPain}
                                        onChange={(e) => setLogPain(Number(e.target.value))}
                                        className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                                        <span>No Pain</span>
                                        <span>Moderate</span>
                                        <span>Severe</span>
                                    </div>
                                </div>

                                {/* Energy Level */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block uppercase tracking-wider">
                                        Energy Level
                                    </label>
                                    <div className="flex gap-2">
                                        {['Low', 'Medium', 'High'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setLogEnergy(level)}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all
                                                    ${logEnergy === level
                                                        ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Pain Areas Selector */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block uppercase tracking-wider">
                                        Where does it hurt? (Optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Lower Back', 'Cramps/Abdomen', 'Head (Migraine)', 'Breasts', 'Legs/Thighs', 'Fatigue'].map(area => (
                                            <button
                                                key={area}
                                                onClick={() => togglePainArea(area)}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all
                                                    ${logPainAreas.includes(area) 
                                                        ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30' 
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            >
                                                {area}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes Input */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wider">
                                        Activity & Habits
                                    </label>
                                    <textarea 
                                        className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="E.g. Ate chocolate, 30min yoga, felt bloated..."
                                        value={logNotes}
                                        onChange={(e) => setLogNotes(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-2 text-right">Visible only to AI</p>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button 
                                        onClick={submitDailyLog} 
                                        className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" /> Save Log
                                    </button>
                                    <button 
                                        onClick={() => setLogOpen(false)} 
                                        className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>

             {/* EXERCISE DETAIL MODAL */}
             <AnimatePresence>
                {selectedExercise && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setSelectedExercise(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                             <div className="md:w-1/2 h-80 md:h-auto relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                {/* Carousel Logic */}
                                {selectedExercise.imageUrls && selectedExercise.imageUrls.length > 0 ? (
                                    <ExerciseCarousel key={selectedExercise.name} images={selectedExercise.imageUrls} name={selectedExercise.name} />
                                ) : (
                                    <img 
                                        src={selectedExercise.imageUrl || `https://loremflickr.com/800/800/yoga,pose,${encodeURIComponent(selectedExercise.name)}/all`}
                                        alt={selectedExercise.name}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                             e.target.onerror = null; 
                                             e.target.src = "https://images.unsplash.com/photo-1544367563-12123d895951?q=80&w=800&auto=format&fit=crop";
                                        }}
                                    />
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:hidden" />
                                <div className="absolute bottom-4 left-4 text-white md:hidden z-10">
                                     <h2 className="text-3xl font-bold mb-1">{selectedExercise.name}</h2>
                                     <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold">{selectedExercise.duration}</span>
                                </div>
                             </div>

                             {/* Content Half */}
                             <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto bg-white dark:bg-slate-900 relative">
                                 <button 
                                    onClick={() => setSelectedExercise(null)}
                                    className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-20"
                                 >
                                     <X className="w-6 h-6 text-slate-500" />
                                 </button>

                                 <div className="hidden md:block mb-6">
                                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedExercise.name}</h2>
                                     <div className="flex items-center gap-3">
                                         <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 px-3 py-1 rounded-full text-sm font-bold">
                                             {selectedExercise.duration}
                                         </span>
                                         <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                                             {selectedExercise.intensity || "Gentle"} intensity
                                         </span>
                                     </div>
                                 </div>
                                 
                                 <div className="space-y-8">
                                     {/* 4️⃣ GEMINI API – TEXT PERSONALIZATION ONLY */}
                                     {/* Displaying Gemini explanation directly under headers */}
                                     <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                         <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2 uppercase tracking-wider">
                                             <Sparkles className="w-4 h-4 text-indigo-500" /> Personalized Guidance
                                         </h3>
                                         <p className="text-indigo-900/80 dark:text-indigo-100/80 leading-relaxed font-medium">
                                             "{selectedExercise.why_it_helps || selectedExercise.benefit}"
                                         </p>
                                     </div>
                                     
                                     {/* Safety Note */}
                                     <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                        <ShieldCheck className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">Safety First</h4>
                                            <p className="text-amber-700/80 dark:text-amber-300/80 text-sm mt-1">
                                                Stop immediately if you feel discomfort, dizziness, or sharp pain. Move slowly.
                                            </p>
                                        </div>
                                     </div>

                                     {selectedExercise.steps && selectedExercise.steps.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-500" /> How to do it
                                            </h3>
                                             <div className="space-y-4">
                                                 {selectedExercise.steps.map((step, idx) => (
                                                     <div key={idx} className="flex gap-4">
                                                         <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 text-sm">
                                                             {idx + 1}
                                                         </span>
                                                         <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1 text-sm">
                                                             {step}
                                                         </p>
                                                     </div>
                                                 ))}
                                             </div>
                                        </div>
                                     )}
                                     
                                     {/* Feedback Loop */}
                                     {feedbackGivenToday.includes(selectedExercise.name) ? (
                                         <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                             <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-sm">
                                                 <Check className="w-4 h-4" /> Feedback Submitted
                                             </div>
                                             <p className="text-slate-400 text-xs mt-2">Thanks for helping us improve!</p>
                                         </div>
                                     ) : (
                                         <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                             <p className="text-slate-400 text-xs mb-3 uppercase tracking-widest font-bold">Did this help?</p>
                                             <div className="flex justify-center gap-4">
                                                 <button 
                                                    onClick={() => handleFeedback('helped')}
                                                    className="flex flex-col items-center gap-1 group"
                                                 >
                                                     <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 transition-all">
                                                         👍
                                                     </div>
                                                     <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500">Helped</span>
                                                 </button>
                                                 
                                                 <button 
                                                    onClick={() => handleFeedback('neutral')}
                                                    className="flex flex-col items-center gap-1 group"
                                                 >
                                                     <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 group-hover:border-amber-200 dark:group-hover:border-amber-800 transition-all">
                                                         😐
                                                     </div>
                                                     <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-500">Neutral</span>
                                                 </button>
    
                                                 <button 
                                                    onClick={() => handleFeedback('didnt_help')}
                                                    className="flex flex-col items-center gap-1 group"
                                                 >
                                                     <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 group-hover:border-rose-200 dark:group-hover:border-rose-800 transition-all">
                                                         👎
                                                     </div>
                                                     <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-500">Didn't Help</span>
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                 </div>

                                 <button 
                                     onClick={() => setSelectedExercise(null)}
                                     className="mt-8 w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg"
                                 >
                                     Close Guide
                                 </button>
                             </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>

             {/* INFO MODAL */}
             <AnimatePresence>
                {infoOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setInfoOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#0b0c15] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Hero Header */}
                            <div className="relative p-8 bg-gradient-to-br from-indigo-900 to-slate-900 overflow-hidden text-center sticky top-0 z-10">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/2 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6">
                                        <Brain className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Unlock Your Body's Wisdom</h2>
                                    <p className="text-indigo-200 text-lg max-w-2xl mx-auto leading-relaxed">
                                        Your cycle is a vital sign. Our Health Intelligence Engine decoding your unique rhythm to provide actionable, daily guidance.
                                    </p>
                                </div>

                                <button onClick={() => setInfoOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* 4 Pillars Grid */}
                            <div className="p-6 grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#0b0c15]">
                                {/* 1. Cycle Analysis */}
                                <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Calendar className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cycle Phase Tracking</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                        We predict your upcoming phases—Menstrual, Follicular, Ovulation, and Luteal—so you can plan your life around your energy levels.
                                    </p>
                                </div>

                                {/* 2. Smart Movement */}
                                <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-teal-200 dark:hover:border-teal-500/30 transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Wind className="w-6 h-6 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Phase-Sync Exercises</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                        Get daily movement recommendations. From high-intensity cardio during ovulation to restorative yoga for menstrual relief.
                                    </p>
                                </div>

                                {/* 3. Nutrition */}
                                <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Heart className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hormonal Nutrition</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                        Discover foods that support your changing hormone levels, helping to reduce bloating, cravings, and fatigue naturally.
                                    </p>
                                </div>

                                {/* 4. Symptom Intelligence */}
                                <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <Sparkles className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Symptom Decoding</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                        Log daily symptoms to train the AI. It learns your unique patterns to warn you of irregularities before they happen.
                                    </p>
                                </div>
                            </div>

                            {/* Footer Call to Action */}
                            <div className="p-8 bg-white dark:bg-[#0b0c15] border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Accuracy increases with logs</p>
                                        <p className="text-xs text-slate-500">The more you track, the smarter it gets.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setInfoOpen(false)}
                                    className="w-full md:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                                >
                                    Start Exploring
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>

            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600">Health Intelligence</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Storage
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setInfoOpen(true)}
                            className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => navigate('/women-health/history')}
                            className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-semibold"
                        >
                            <History className="w-4 h-4" /> Previous Analysis
                        </button>
                    </div>
                </div>
                



                {/* MAIN WORKFLOW STATES */}

                {/* 1. ESTIMATE NEEDED View */}
                {!hasEstimate && !isPeriodActive && (
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-3xl p-10 border border-rose-100 dark:border-rose-900/20 text-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
                            <Calendar className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Setup Upcoming Cycle</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                            To help AI track accurately, please provide the estimated date for your next period.
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <input 
                                type="date" 
                                value={estimateDate}
                                onChange={(e) => setEstimateDate(e.target.value)}
                                className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            <button 
                                onClick={handleSetEstimate}
                                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
                            >
                                Set Prediction <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}


                {/* 2. WAITING / PROMPT View */}
                {hasEstimate && !isPeriodActive && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl h-full flex flex-col justify-center">
                             <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                    <Clock className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Status: Waiting</h2>
                                    <p className="text-sm text-slate-500">Expected: {format(new Date(nextEstimate), 'MMMM dd')}</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className={`p-4 rounded-2xl border ${isOverdue ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                    <h3 className={`font-bold flex items-center gap-2 mb-2 ${isOverdue ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />} 
                                        {isOverdue ? "Action Needed" : "Tracking Active"}
                                    </h3>
                                    <p className={`${isOverdue ? 'text-rose-600/80 dark:text-rose-300' : 'text-slate-600/80 dark:text-slate-400'} text-sm`}>
                                        {isOverdue ? "It looks like the expected date has arrived." : "We are tracking for your upcoming cycle. If it starts early, let us know."}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Has your period started?</h3>
                                    <div className="flex gap-3">
                                        <button onClick={handleConfirmStart} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">
                                            Yes, Started Today
                                        </button>
                                        <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 cursor-not-allowed opacity-50">
                                            No, Not Yet
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                        
                        {/* Waiting Illustration or Info */}
                        <div className="hidden md:block opacity-50">
                             <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={[{d:1,v:20},{d:2,v:30},{d:3,v:60},{d:4,v:30}]}>
                                    <Area type="monotone" dataKey="v" stroke="#cbd5e1" fill="#f1f5f9" />
                                </AreaChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                )}


                {/* 3. ACTIVE View */}
                {isPeriodActive && (
                    <div className="space-y-8">
                        
                        {/* DELAYED ANALYSIS BANNER - If analysis is pending for future */}
                        {data?.toBeAnalyzedAt && new Date(data.toBeAnalyzedAt) > new Date() && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-50 dark:bg-indigo-900/50 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-indigo-900/5"
                            >
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                                    <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-indigo-900 dark:text-white font-bold flex items-center gap-2">
                                        Analysis Scheduled
                                        <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">24h Delay Active</span>
                                    </h3>
                                    <p className="text-indigo-700/80 dark:text-indigo-200/80 text-sm">
                                        Processing everyday at a consistent time to capture your full day's logs. Next update: {data.toBeAnalyzedAt ? `${format(new Date(data.toBeAnalyzedAt), 'h:mm a')} tomorrow` : 'Tomorrow'}
                                    </p>
                                </div>
                            </motion.div>
                        )}


                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* LEFT COLUMN - MAIN STATUS */}
                            <div className="lg:col-span-2 space-y-8">
                                 {/* Deluxe Active Cycle Card */}
                                 <div className="bg-white dark:bg-[#0f172a] rounded-[2rem] p-8 border border-white/10 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                                     {/* Background Effects */}
                                     <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-rose-500/20 transition-all duration-1000" />
                                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                                     
                                     <div className="relative z-10">
                                         <div className="flex items-start justify-between mb-8">
                                             <div>
                                                 <motion.div 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-4 border border-rose-100 dark:border-rose-800"
                                                 >
                                                     <Activity className="w-3 h-3" /> Live Tracking
                                                 </motion.div>
                                                 <div className="flex items-baseline gap-4 mb-2">
                                                     <h2 className="text-5xl font-light text-slate-900 dark:text-white tracking-tight">
                                                        {analysis?.phase || "Menstrual Phase"}
                                                     </h2>
                                                 </div>
                                                 <div className="text-xl text-slate-500 dark:text-slate-400 font-medium">
                                                    Day <span className="text-rose-500 font-bold text-2xl mx-1">{cycleDay}</span> of {backendCycleLength}+
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={handleStopCycle}
                                                className="px-5 py-2.5 bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl backdrop-blur-md transition-all flex items-center gap-2"
                                             >
                                                <X className="w-4 h-4" /> Stop Cycle
                                             </button>
                                         </div>

                                         {/* Immersive Graph */}
                                         <div className="h-64 w-full -mx-4 md:px-4">
                                             <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
                                                     <defs>
                                                        <linearGradient id="energyGradient2" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                                                            border: theme === 'dark' ? 'none' : '1px solid #e2e8f0', 
                                                            borderRadius: '16px', 
                                                            color: theme === 'dark' ? '#fff' : '#0f172a', 
                                                            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' 
                                                        }} 
                                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}
                                                        cursor={{ stroke: '#e11d48', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="intensity" 
                                                        stroke="#e11d48" 
                                                        strokeWidth={4}
                                                        fill="url(#energyGradient2)" 
                                                        animationDuration={2000}
                                                    />
                                                    <ReferenceLine x={cycleDay} stroke="#e11d48" strokeDasharray="3 3">
                                                        <Label value="TODAY" position="top" fill="#e11d48" fontSize={12} fontWeight="bold" />
                                                    </ReferenceLine>
                                                </AreaChart>
                                             </ResponsiveContainer>
                                         </div>
                                     </div>
                                 </div>

                                 {/* AI Insights Deck */}
                                 <div className="grid grid-cols-1 gap-6">
                                     <div className="flex items-center justify-between px-2">
                                         <h3 className="text-2xl font-bold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                                             <Brain className="w-6 h-6 text-purple-500" /> Daily Intelligence
                                         </h3>
                                         {(analysis?.analysisTimestamp || data?.lastUpdated) && (
                                             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    Updated {formatDistanceToNow(new Date(analysis?.analysisTimestamp || data?.lastUpdated), { addSuffix: true })}
                                                </span>
                                             </div>
                                         )}
                                     </div>
                                     
                                     <div className="grid md:grid-cols-2 gap-4">
                                        <RecommendationCard icon={Heart} title="Nutrition & Diet" desc={analysis?.recommendations?.nutrition} color="from-emerald-400 to-teal-500" delay={0.1} />
                                        <RecommendationCard icon={Wind} title="Movement" desc={analysis?.recommendations?.exercise} color="from-blue-400 to-indigo-500" delay={0.2} />
                                        <RecommendationCard icon={Droplet} title="Hygiene Care" desc={analysis?.recommendations?.hygiene} color="from-pink-400 to-rose-500" delay={0.3} />
                                        <RecommendationCard icon={Sun} title="Emotional State" desc={analysis?.recommendations?.mood} color="from-amber-400 to-orange-500" delay={0.4} />
                                     </div>

                                     {/* IMPORTANT NOTICES (Warnings/Discrepancies) */}
                                     {analysis?.important_notices && analysis.important_notices.length > 0 && (
                                         <motion.div 
                                             initial={{ opacity: 0, y: 10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             className="mt-6 p-6 rounded-2xl bg-amber-900/10 border border-amber-500/30 relative overflow-hidden"
                                         >
                                             <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                                             <h3 className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                                 <AlertTriangle className="w-5 h-5" /> Important Notices
                                             </h3>
                                             <div className="space-y-3">
                                                 {analysis.important_notices.map((notice, idx) => (
                                                     <div key={idx} className="flex gap-3 items-start bg-amber-500/10 p-3 rounded-lg border border-amber-500/10">
                                                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                                         <p className="text-amber-800 dark:text-amber-200 text-sm font-medium leading-relaxed">
                                                             {notice}
                                                         </p>
                                                     </div>
                                                 ))}
                                             </div>
                                         </motion.div>
                                     )}
                                 </div>

                                 {/* MOVEMENT & RECOVERY SECTION */}
                                 {/* MOVEMENT & RECOVERY SECTION */}
                                 {/* Always render, using defaults if AI hasn't run yet */}
                                 {(() => {
                                    const defaultExercises = [
                                        { 
                                            name: "Child's Pose", 
                                            focus: "Relaxation", 
                                            benefit: "Gently stretches the lower back and hips.", 
                                            duration: "5 min",
                                            imageUrl: "/images/yoga/balasana/1.jpg",
                                            imageUrls: ["/images/yoga/balasana/1.jpg", "/images/yoga/balasana/2.avif"],
                                            steps: ["Kneel on the floor.", "Touch your big toes together and sit on your heels.", "Exhale and lay your torso down between your thighs.", "Lay your hands on the floor alongside your torso."]
                                        },
                                        { 
                                            name: "Cat-Cow Stretch", 
                                            focus: "Spine Mobility", 
                                            benefit: "Relieves tension in the spine and neck.", 
                                            duration: "10 reps",
                                            imageUrl: "/images/yoga/cat_cow/1.jpg",
                                            imageUrls: ["/images/yoga/cat_cow/1.jpg"],
                                            steps: ["Start on your hands and knees.", "Inhale, drop your belly towards the mat (Cow).", "Exhale, draw your belly to your spine and round your back (Cat).", "Repeat 10-15 times."]
                                        },
                                        { 
                                            name: "Legs Up Wall", 
                                            focus: "Circulation", 
                                            benefit: "Improves blood flow and reduces fatigue.", 
                                            duration: "10 min",
                                            imageUrl: "/images/yoga/viparita_karani/1.jpg",
                                            imageUrls: ["/images/yoga/viparita_karani/1.jpg", "/images/yoga/viparita_karani/2.jpg"],
                                            steps: ["Sit close to a wall.", "Swing your legs up onto the wall.", "Rest your head and shoulders on the floor.", "Relax and breathe deeply."]
                                        }
                                    ];
                                     const exercises = analysis?.exercises?.length > 0 ? analysis.exercises : defaultExercises;

                                     return (
                                         <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                                 <Wind className="w-5 h-5 text-teal-500" /> Movement & Recovery 
                                                 <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                    {analysis?.phase ? `${analysis.phase} Focus` : "General Care"}
                                                 </span>
                                             </h3>
                                             
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                 {exercises.map((ex, idx) => (
                                                     <motion.div 
                                                         key={idx}
                                                         onClick={() => setSelectedExercise(ex)}
                                                         initial={{ opacity: 0, scale: 0.95 }}
                                                         animate={{ opacity: 1, scale: 1 }}
                                                         transition={{ delay: 0.5 + (idx * 0.1) }}
                                                         className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all"
                                                     >
                                                         {/* Authenticated Cloudinary Image (or Fallback) */}
                                                         <img 
                                                             src={ex.imageUrl || `https://loremflickr.com/600/600/yoga,pose,${encodeURIComponent(ex.name)}/all`}
                                                             alt={ex.name}
                                                             className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                             loading="lazy"
                                                             onError={(e) => {
                                                                 e.target.onerror = null; 
                                                                 e.target.src = "https://images.unsplash.com/photo-1544367563-12123d895951?q=80&w=600&auto=format&fit=crop"; // Generic Yoga Fallback
                                                             }}
                                                         />
                                                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                         
                                                         <div className="absolute bottom-0 left-0 p-5 w-full z-10">
                                                             <div className="flex justify-between items-end mb-1">
                                                                 <h4 className="font-bold text-lg text-white group-hover:text-rose-200 transition-colors">{ex.name}</h4>
                                                                 <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                                                     {ex.duration}
                                                                 </span>
                                                             </div>
                                                             <p className="text-xs text-white/90 line-clamp-2 mb-2 font-medium">{ex.benefit}</p>
                                                             <div className="flex items-center justify-between">
                                                                 <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/90 px-2 py-0.5 rounded text-white shadow-lg">
                                                                    {ex.focus}
                                                                 </span>
                                                                 <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                                     View Guide <ArrowRight className="w-3 h-3" />
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </motion.div>
                                                 ))}
                                             </div>
                                         </div>
                                     );
                                 })()}
                            </div>

                            {/* RIGHT COLUMN - ACTIONS & LOGS */}
                             <div className="space-y-8">
                                {/* Deluxe Check-in Card */}
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative rounded-[2rem] p-8 overflow-hidden shadow-2xl ${
                                        isCheckinLocked 
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' 
                                        : 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
                                    }`}
                                >
                                    {/* Texture */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 backdrop-blur-md rounded-2xl ${isCheckinLocked ? 'bg-emerald-100 dark:bg-white/10' : 'bg-white/10'}`}>
                                                    {isCheckinLocked 
                                                        ? <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /> 
                                                        : <Plus className="w-8 h-8 text-white" />
                                                    }
                                                </div>
                                                {isCheckinLocked && (
                                                    <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                                        COMPLETE
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-3xl font-bold mb-2">
                                                {isCheckinLocked ? "All Caught Up" : "Daily Log"}
                                            </h3>
                                            <p className={`text-lg leading-relaxed ${isCheckinLocked ? 'text-slate-500 dark:text-slate-400' : 'text-white/70'}`}>
                                                {isCheckinLocked 
                                                    ? "Great job tracking today. Analysis will update automatically." 
                                                    : "Track your symptoms to personalize your AI insights."}
                                            </p>
                                        </div>
                                        
                                        {!logOpen && (
                                            <button 
                                                onClick={() => !isCheckinLocked && setLogOpen(true)} 
                                                disabled={isCheckinLocked}
                                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg
                                                    ${isCheckinLocked 
                                                        ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-default' 
                                                        : 'bg-white text-rose-600 hover:bg-rose-50 hover:shadow-xl hover:-translate-y-1'}`}
                                            >
                                                {isCheckinLocked ? (
                                                    <>
                                                        <Clock className="w-5 h-5" /> Next check-in: {timeRemaining}
                                                    </>
                                                ) : (
                                                    <>
                                                        Log Now <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>

                                 {/* Calendar Widget */}
                                 <CycleCalendar cycleData={cycleData} logs={data?.data?.dailyLogs} history={data?.data?.history} />

                                {/* Notices/Flags */}
                                 {analysis?.flags?.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] p-6 border border-amber-100 dark:border-amber-900/30">
                                        <h3 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2 mb-4 text-sm uppercase tracking-widest">
                                            <AlertTriangle className="w-4 h-4" /> Important Notices
                                        </h3>
                                        <ul className="space-y-3">
                                            {analysis.flags.map((flag, idx) => (
                                                <li key={idx} className="bg-amber-100/50 dark:bg-amber-900/20 p-3 rounded-xl text-sm text-amber-900 dark:text-amber-100 flex items-start gap-3">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                                                    {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

             </div>
        </div>
    );
};

// Image Carousel Component
const ExerciseCarousel = ({ images, name }) => {
    const [index, setIndex] = useState(0);

    const next = (e) => {
        e.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e) => {
        e.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-full group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030014]/80 z-10" />
            <img 
                src={images[index]}
                alt={`${name} view ${index + 1}`}
                className="w-full h-full object-contain p-4 transition-all duration-500 relative z-0"
                onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1544367563-12123d895951?q=80&w=800&auto=format&fit=crop";
                }}
            />
            
            {images.length > 1 && (
                <>
                    <button 
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <button 
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {images.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === idx ? 'bg-rose-500 w-6 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-white/20 w-1.5'}`} 
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const RecommendationCard = ({ icon: Icon, title, desc, color, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay || 0 }}
        className="p-6 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group min-h-[160px] flex flex-col justify-between relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-[50px] rounded-full pointer-events-none group-hover:opacity-20 transition-opacity`} />
        
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
                 <ArrowRight className="w-4 h-4 -rotate-45" />
            </div>
        </div>
        
        <div className="relative z-10">
            <h4 className="text-lg font-bold text-white mb-2 tracking-wide">{title}</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-medium line-clamp-3 group-hover:text-slate-300 transition-colors">{desc || "No active data."}</p>
        </div>
    </motion.div>
);

function CycleCalendar({ cycleData, logs, history }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Cycle Calculations
    const rawCycleLength = cycleData?.cycleLength || 28;
    const cycleLength = Math.max(rawCycleLength, 28);
    const lastStart = cycleData?.lastPeriodStart ? new Date(cycleData.lastPeriodStart) : null;

    const getDayPhase = (date) => {
        const dateTime = date.getTime();
        
        // 1. Check History (Past Cycles) - Continuous Rendering
        if (history && history.length > 0) {
            
            // Collect all "Start Dates" (History + Current)
            const allStarts = history.map(h => ({ date: new Date(h.start), type: 'history', end: h.end ? new Date(h.end) : null }));
            if (lastStart) allStarts.push({ date: lastStart, type: 'active', end: null });
            
            // Sort Ascending
            allStarts.sort((a, b) => a.date - b.date);

            // Find the segment
            for (let i = 0; i < allStarts.length; i++) {
                const cycle = allStarts[i];
                const nextCycle = allStarts[i+1];
                
                if (dateTime >= cycle.date.getTime()) {
                    // It started after this cycle started. 
                    // Is it before the next one?
                    if (!nextCycle || dateTime < nextCycle.date.getTime()) {
                         // FOUND OWNER CYCLE
                         
                         // A. Determine Bleeding Status (Strict History Respect)
                         if (cycle.type === 'history' && cycle.end) {
                             if (dateTime <= cycle.end.getTime()) {
                                 // It is within the RECORDED bleeding range -> RED
                                 return { type: 'menstrual', color: 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]', isHistory: true };
                             }
                             // Else: It is past bleeding, calculate Phase
                         } else if (cycle.type === 'active') {
                             // Active Cycle Logic
                         }

                         // B. Calculate Phase & Cycle Index
                         const diff = differenceInDays(date, cycle.date);
                         let dayOfCycle = diff + 1;
                         let isFutureCycle = false;

                         if (cycle.type === 'active') {
                             // Active cycle extends infinitely, so we must calculate Cycle Index
                             // to see if this date is part of Current (0) or Future (>0) cycles.
                             const cLength = Math.max(cycleData.cycleLength || 28, 28);
                             const cycleIndex = Math.floor(diff / cLength);
                             dayOfCycle = (diff % cLength) + 1;
                             isFutureCycle = cycleIndex > 0;
                         }

                         // Color Logic
                         if (dayOfCycle <= 5) {
                             if (isFutureCycle) {
                                  // Future Month Prediction -> Dotted
                                  return { type: 'menstrual', color: 'border border-rose-500/50 text-rose-400 bg-rose-500/10' };
                             }

                             if (cycle.type === 'active' && cycleData.isPeriodActive) {
                                 // Active Cycle & Period is marked Active (Index 0)
                                 const todayStart = new Date();
                                 todayStart.setHours(0,0,0,0);
                                 
                                 if (date > todayStart) {
                                     // Predicted Bleeding (Index 0) -> Light Rose
                                     return { type: 'menstrual', color: 'bg-rose-900/40 text-rose-200 border border-rose-500/20' };
                                 } else {
                                     // Confirmed Bleeding (Index 0) -> Solid Rose
                                     return { type: 'menstrual', color: 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.5)]' };
                                 }
                             }
                             
                             // Fallback (History early stop OR Active stopped)
                             return { type: 'follicular', color: 'bg-rose-500/10 text-rose-300' };
                         } 
                         else if (dayOfCycle >= 14 && dayOfCycle <= 15) {
                             // Ovulation
                             if (isFutureCycle) return { type: 'ovulation', color: 'border border-indigo-400/50 text-indigo-300 bg-indigo-500/10' };
                             return { type: 'ovulation', color: 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' };
                         }
                         else if (dayOfCycle > 5 && dayOfCycle < 14) {
                             // Follicular
                             return { type: 'follicular', color: 'text-rose-200' };
                         }
                         else {
                             // Luteal
                             return { type: 'luteal', color: 'text-slate-400' }; 
                         }
                    }
                }
            }
        }

        // 2. Future Prediction (If no cycle owns it aka Future)
        if (lastStart && dateTime > lastStart.getTime()) {
            const diff = differenceInDays(date, lastStart);
            const cycleIndex = Math.floor(diff / cycleLength);
            
            if (cycleIndex > 0) {
                 const dayOfCycle = (diff % cycleLength) + 1;
                 
                 if (dayOfCycle <= 5) return { type: 'future', color: 'border border-rose-500/30 text-rose-500/70 bg-rose-500/5', isFuture: true };
                 else if (dayOfCycle >= 14 && dayOfCycle <= 15) return { type: 'future', color: 'border border-indigo-400/30 text-indigo-400/70 bg-indigo-500/5', isFuture: true };
                 else return { type: 'luteal', color: 'text-slate-600' };
            }
        }
        
        return null;
    };


    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;
            
            const phase = getDayPhase(cloneDay);
            const isLog = logs?.some(l => isSameDay(new Date(l.date), cloneDay));
            const isToday = isSameDay(cloneDay, new Date());
            const isCurrentMonth = isSameMonth(cloneDay, monthStart);

            days.push(
                <div 
                    key={day} 
                    className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold relative mb-2 transition-all duration-300
                        ${!isCurrentMonth ? 'opacity-20' : ''}
                        ${phase ? phase.color : 'text-slate-700 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}
                        ${isToday ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-[0_0_15px_rgba(0,0,0,0.3)] dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}
                    `}
                >
                    {formattedDate}
                    {isLog && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                    )}
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="flex justify-between w-full" key={day}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="bg-white dark:bg-[#0b0c15] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 relative overflow-hidden backdrop-blur-md shadow-xl dark:shadow-none">
             {/* Decor */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />

             <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight pl-2">{format(currentMonth, 'MMMM yyyy')}</span>
                <div className="flex gap-2">
                    <button onClick={onPrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-indigo-600 dark:text-indigo-300 transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /></button>
                    <button onClick={onNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-indigo-600 dark:text-indigo-300 transition-colors"><ArrowRight className="w-4 h-4" /></button>
                </div>
             </div>
             
             <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-6 px-2 tracking-widest uppercase">
                 {['S','M','T','W','T','F','S'].map((d,i) => <span key={i} className="w-9 text-center">{d}</span>)}
             </div>

             <div className="space-y-1 relative z-10">
                {rows}
             </div>

             <div className="flex gap-4 mt-8 text-[10px] font-bold text-slate-500 justify-center uppercase tracking-wider">
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]" /> Period</div>
                 <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> Ovulation</div>
                 <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Logged</div>
             </div>
        </div>
    );
};

export default WomenHealth;