import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Meh, Frown, X, Check, Star, AlertCircle, 
  Zap, Activity, Thermometer, Wind, Heart 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const DailyHealthReviewWidget = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [isVisible, setIsVisible] = useState(false);
    const [statusData, setStatusData] = useState(null);
    
    // Form State
    const [selectedMood, setSelectedMood] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(7);
    const [bodyStatus, setBodyStatus] = useState([]);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/daily-review/status`, {
                     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.data.showReview) {
                    setStatusData(res.data);
                    setIsVisible(true);
                    notify.info("Please log your daily health status!");
                }
            } catch (err) {
                console.error("Failed to check review status", err);
            }
        };

        if (user) {
            checkStatus();
        }
    }, [user]);

    const handleToggleSymptom = (id) => {
        setBodyStatus(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!selectedMood) return;

        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/daily-review`, {
                mood: selectedMood,
                energyLevel,
                bodyStatus,
                reviewText
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            notify.success("Daily health status logged successfully!");
            setIsVisible(false);
        } catch (err) {
            console.error("Failed to submit review", err);
            setSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const moods = [
        { id: 'excellent', icon: Star, label: 'Amazing', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        { id: 'good', icon: Smile, label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        { id: 'neutral', icon: Meh, label: 'Okay', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
        { id: 'bad', icon: Frown, label: 'Poor', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
        { id: 'awful', icon: AlertCircle, label: 'Awful', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    ];

    const symptoms = [
        { id: 'Normal', icon: Activity },
        { id: 'Pain', icon: Thermometer },
        { id: 'Nausea', icon: Wind },
        { id: 'Fever', icon: Thermometer },
        { id: 'Fatigue', icon: Zap },
        { id: 'Headache', icon: AlertCircle },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: [
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                        "0 0 0 4px rgba(129, 255, 139, 0.15), 0 20px 25px -5px rgb(0 0 0 / 0.1)",
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                    ]
                }}
                transition={{
                    opacity: { duration: 0.4 },
                    y: { duration: 0.4 },
                    boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden relative"
            >
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Heart className="w-5 h-5 text-rose-500 fill-current" />
                                How are you feeling today?
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {statusData?.formattedDate}
                            </p>
                        </div>
                        <button 
                            onClick={handleDismiss}
                            className="p-2 -mr-2 -mt-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-8">
                        {moods.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMood === m.id;
                            
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMood(m.id)}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300
                                        ${isSelected 
                                            ? `${m.bg} border-${m.color.split('-')[1]}-500/50 shadow-md scale-105` 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    <Icon className={`h-8 w-8 mb-2 ${isSelected ? m.color : 'text-slate-400 dark:text-slate-500'}`} />
                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                        {m.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {selectedMood && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-8 pt-2"
                            >
                                {/* Energy Level */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">Today's Energy Level</span>
                                        <span className="text-xl font-black text-emerald-500">{energyLevel}</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="10" 
                                        value={energyLevel}
                                        onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>

                                {/* Body Status */}
                                <div className="space-y-4">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">Physical Status</span>
                                    <div className="flex flex-wrap gap-2">
                                        {symptoms.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => handleToggleSymptom(s.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-300 ${
                                                    bodyStatus.includes(s.id)
                                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500/50'
                                                }`}
                                            >
                                                <s.icon className="w-4 h-4" />
                                                {s.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-3">
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Any specific symptoms or health notes from today?"
                                        className="w-full p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/50 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-28 text-sm transition-all"
                                    />
                                </div>
                                
                                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleDismiss}
                                        className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-slate-900/10 hover:shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {submitting ? 'Saving...' : (
                                            <>
                                                Submit Log
                                                <Check className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DailyHealthReviewWidget;

