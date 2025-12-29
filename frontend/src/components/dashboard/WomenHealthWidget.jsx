import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Sparkles, Activity, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { format, addDays, isPast, differenceInDays } from 'date-fns';

const WomenHealthWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPeriodPrompt, setShowPeriodPrompt] = useState(false);

    if (!user || user.gender !== 'female') return null;

    useEffect(() => {
        const fetchHealthData = async () => {
            try {
                const res = await api.get(`/women-health/${user._id}`);
                setHealthData(res.data);
                checkPeriodPrompt(res.data);
            } catch (error) {
                console.error("Failed to fetch women health data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user._id) {
            fetchHealthData();
        }
    }, [user._id]);

    const checkPeriodPrompt = (data) => {
        const nextEstimate = data?.data?.cycleData?.nextEstimatedStartDate;
        const isActive = data?.data?.cycleData?.isPeriodActive;

        if (isActive) {
            setShowPeriodPrompt(false);
            return;
        }

        if (nextEstimate) {
            // Show prompt immediately if we have a locked estimate and no active period
            setShowPeriodPrompt(true);
        }
    };

    const handlePeriodStartConfirm = async () => {
        try {
            await api.post(`/women-health/${user._id}/cycle-start-confirm`);
            setShowPeriodPrompt(false);
            // Refresh
            const res = await api.get(`/women-health/${user._id}`);
            setHealthData(res.data);
        } catch (err) {
            console.error("Failed to log cycle start", err);
        }
    };

    const handleNavigate = () => {
        navigate(`/women-health/${user._id}`);
    };

    const statusColor = healthData?.analysis?.status?.color || "emerald";
    const statusText = healthData?.analysis?.status?.status || "Normal";

    // Logic for Widget Display
    const isActive = healthData?.data?.cycleData?.isPeriodActive;
    const hasEstimate = !!healthData?.data?.cycleData?.nextEstimatedStartDate;
    
    // Dynamic Color Mapping
    const getStatusColor = (color) => {
        switch(color) {
            case 'red': return 'text-red-500 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'orange': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case 'yellow': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
            default: return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
        }
    };

    // Prepare Chart Data from History
    const historyData = (healthData?.data?.history || [])
        .slice(0, 6)
        .reverse()
        .map((h, i) => ({
            name: `C${i + 1}`,
            length: h.cycleLength || 28 // Fallback to 28 if missing
        }));

    const avgLength = healthData?.analysis?.cycleTrends?.averageLength || 28;
    
    // Logic: Check DB estimate first, then AI prediction, else calculate based on Last Start + Avg Length
    let rawNextDate = healthData?.data?.cycleData?.nextEstimatedStartDate || healthData?.analysis?.predictedNextCycleStart;
    
    // If active or just started, calculating next month manually if raw is missing
    if (!rawNextDate && healthData?.data?.cycleData?.lastPeriodStart) {
        const lastStart = new Date(healthData.data.cycleData.lastPeriodStart);
        rawNextDate = addDays(lastStart, avgLength);
    }

    const nextDate = rawNextDate ? format(new Date(rawNextDate), 'MMM d') : '--';

    return (
        <motion.div
            layout
            className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg shadow-rose-500/5 group"
            whileHover={{ y: -2 }}
        >
             {/* Period Prompt Overlay */}
             <AnimatePresence>
                {showPeriodPrompt && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <HelpCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Has your period started today?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">It's the expected date. Let us know to start tracking.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={handlePeriodStartConfirm}
                                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all"
                            >
                                Yes, Started
                            </button>
                            <button 
                                onClick={() => setShowPeriodPrompt(false)}
                                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                Not Yet
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row h-full min-h-[180px] cursor-pointer" onClick={handleNavigate}>
                {/* Left: Main Status & Graph */}
                <div className="w-full sm:w-[45%] bg-rose-50/50 dark:bg-rose-900/5 p-5 relative flex flex-col justify-between">
                    <div className="flex flex-col gap-2 relative z-10">
                         {healthData?.analysis?.cycleTrends?.status && (
                             <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 w-fit ${getStatusColor(healthData.analysis.cycleTrends.color)}`}>
                                <Activity className="w-3.5 h-3.5" />
                                {healthData.analysis.cycleTrends.status}
                             </div>
                         )}
                         <div className="text-xs text-slate-400 font-medium ml-1">Last 6 Cycles</div>
                    </div>
                    
                    {/* Real History Graph */}
                    <div className="h-28 w-full mt-2 -mb-2">
                         {historyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorCycle" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <Area 
                                        type="monotone" 
                                        dataKey="length" 
                                        stroke="#f43f5e" 
                                        strokeWidth={3}
                                        fill="url(#colorCycle)" 
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                         ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                No history yet
                            </div>
                         )}
                    </div>
                </div>

                {/* Right: Detailed Stats */}
                <div className="w-full sm:w-[55%] p-6 flex flex-col justify-center relative">
                    <Sparkles className="absolute top-6 right-6 w-5 h-5 text-rose-400 opacity-50 animate-pulse" />
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        Women's Health
                        {isActive && <span className="animate-pulse w-2 h-2 rounded-full bg-rose-500"></span>}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Current Status</p>
                            <div className="text-lg font-bold text-rose-500 dark:text-rose-400">
                                {isActive ? (healthData?.analysis?.phase || "Period") : (hasEstimate ? "Upcoming" : "Setup")}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Cycle Day</p>
                             <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                {isActive || hasEstimate ? `Day ${healthData?.analysis?.cycleDay || 1}` : '--'}
                             </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Avg Length</p>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                {avgLength} Days
                            </div>
                        </div>
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Next Expected</p>
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                {nextDate}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WomenHealthWidget;
