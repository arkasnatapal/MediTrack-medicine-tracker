import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, X, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DailyHealthReviewWidget = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [statusData, setStatusData] = useState(null);
    const [selectedMood, setSelectedMood] = useState(null);
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
                }
            } catch (err) {
                console.error("Failed to check review status", err);
            }
        };

        if (user) {
            checkStatus();
        }
    }, [user]);

    const handleSubmit = async () => {
        if (!selectedMood) return;

        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/daily-review`, {
                mood: selectedMood,
                reviewText
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            // Close widget gracefully
            setIsVisible(false);
        } catch (err) {
            console.error("Failed to submit review", err);
            setSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // We could locally store "dismissed" for session if we wanted, 
        // but backend won't count it as submitted, so it might reappear next reload.
        // Spec says: "Cancel closes UI without side effects". 
        // It implies temporary close.
    };

    if (!isVisible) return null;

    const moods = [
        { id: 'good', icon: Smile, label: 'Good', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        { id: 'neutral', icon: Meh, label: 'Neutral', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
        { id: 'bad', icon: Frown, label: 'Bad', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                How did you feel yesterday?
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

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {moods.map((m) => {
                            const Icon = m.icon;
                            const isSelected = selectedMood === m.id;
                            
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMood(m.id)}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200
                                        ${isSelected 
                                            ? `${m.bg} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-${m.color.split('-')[1]}-500 shadow-md` 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    <Icon className={`h-8 w-8 mb-2 ${isSelected ? m.color : 'text-slate-400 dark:text-slate-500'}`} />
                                    <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
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
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="Any improved symptoms or issues? (Optional)"
                                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 resize-none h-24 text-sm"
                                />
                                
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleDismiss}
                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {submitting ? 'Submitting...' : (
                                            <>
                                                Submit Review
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
