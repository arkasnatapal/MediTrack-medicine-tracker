import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, Activity, Calendar, Clock, ChevronRight, Droplets } from 'lucide-react';
import { format, addDays } from 'date-fns';

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
            const today = new Date();
            const estimateDate = new Date(nextEstimate);
            // Simple check: if today is on or after estimate date (and not way past, e.g. within 3 days)
            const diffTime = today - estimateDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= 0 && diffDays <= 3) {
                setShowPeriodPrompt(true);
            }
        }
    };

    const handlePeriodStartConfirm = async (e) => {
        e.stopPropagation();
        try {
            await api.post(`/women-health/${user._id}/cycle-start-confirm`);
            setShowPeriodPrompt(false);
            const res = await api.get(`/women-health/${user._id}`);
            setHealthData(res.data);
        } catch (err) {
            console.error("Failed to log cycle start", err);
        }
    };

    const handleNavigate = () => {
        navigate(`/women-health/${user._id}`);
    };

    // Logic for Widget Display
    const isActive = healthData?.data?.cycleData?.isPeriodActive;
    const hasEstimate = !!healthData?.data?.cycleData?.nextEstimatedStartDate;
    
    // History Data for Graph
    const historyData = (healthData?.data?.history || [])
        .slice(0, 6)
        .reverse()
        .map((h, i) => ({
            name: `C${i + 1}`,
            length: h.cycleLength || 28
        }));

    const avgLength = healthData?.analysis?.cycleTrends?.averageLength || 28;
    
    // Estimate Logic
    let rawNextDate = healthData?.data?.cycleData?.nextEstimatedStartDate || healthData?.analysis?.predictedNextCycleStart;
    if (!rawNextDate && healthData?.data?.cycleData?.lastPeriodStart) {
        const lastStart = new Date(healthData.data.cycleData.lastPeriodStart);
        rawNextDate = addDays(lastStart, avgLength);
    }
    const nextDate = rawNextDate ? format(new Date(rawNextDate), 'MMM d') : '--';

    // Status Config
    const isPeriod = isActive;
    const isOvulation = healthData?.analysis?.phase === 'Ovulation';
    
    const getThemeColor = () => {
        if (isPeriod) return 'from-rose-500 to-pink-600';
        if (isOvulation) return 'from-purple-500 to-indigo-600';
        return 'from-emerald-400 to-teal-600';
    };

    const StatusIcon = isPeriod ? Droplets : (isOvulation ? Sparkles : Activity);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 relative group cursor-pointer"
            onClick={handleNavigate}
        >
            {/* Main Glass Container */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/60 dark:border-white/10 shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.005]" />
            
            {/* Ambient Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${getThemeColor()} opacity-0 blur-xl transition-opacity duration-700 rounded-3xl`} />

            <div className="relative p-6 h-full flex flex-col sm:flex-row gap-6">
                
                {/* Left Section: Hero Status & Visual */}
                <div className="w-full sm:w-5/12 flex flex-col justify-between relative overflow-hidden rounded-2xl bg-white/50 dark:bg-black/20 border border-white/40 dark:border-white/5 p-5">
                    {/* Background accent */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${getThemeColor()} opacity-20 blur-2xl`} />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Current Phase</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                             {healthData?.analysis?.phase || "Tracking"}
                             {isPeriod && <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                             </span>}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Cycle Day {healthData?.analysis?.cycleDay || 1}
                        </p>
                    </div>

                    {/* Mini History Graph */}
                    <div className="h-24 w-full mt-4 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyData}>
                                <defs>
                                    <linearGradient id="widgetGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPeriod ? '#f43f5e' : (isOvulation ? '#8b5cf6' : '#10b981')} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={isPeriod ? '#f43f5e' : (isOvulation ? '#8b5cf6' : '#10b981')} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="length" 
                                    stroke={isPeriod ? '#f43f5e' : (isOvulation ? '#8b5cf6' : '#10b981')} 
                                    strokeWidth={3}
                                    fill="url(#widgetGradient)" 
                                    isAnimationActive={true}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Section: Bento Grid Stats */}
                <div className="w-full sm:w-7/12 grid grid-cols-2 gap-3">
                    {/* Next Period Card */}
                    <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-white/40 dark:border-white/5 flex flex-col justify-center relative overflow-hidden group/card hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <Calendar className="w-5 h-5 text-rose-500 mb-2 opacity-80" />
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{nextDate}</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Expected</div>
                        {/* Hover effect */}
                        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-rose-500 to-transparent opacity-0 transition-opacity" />
                    </div>

                     {/* Avg Length Card */}
                     <div className="bg-white/40 dark:bg-white/5 rounded-2xl p-4 border border-white/40 dark:border-white/5 flex flex-col justify-center relative overflow-hidden group/card hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <Clock className="w-5 h-5 text-indigo-500 mb-2 opacity-80" />
                        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{avgLength}d</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Cycle</div>
                        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-transparent opacity-0 transition-opacity" />
                    </div>

                    {/* Status / Prediction Card (Spans 2 cols) */}
                    <div className="col-span-2 bg-gradient-to-r from-slate-100/50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl p-4 border border-white/40 dark:border-white/5 flex items-center justify-between group/long">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getThemeColor()} text-white shadow-lg shadow-purple-500/20`}>
                                <StatusIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {healthData?.analysis?.status?.status || "Health Normal"}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {healthData?.analysis?.status?.message || "No irregularities detected"}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover/long:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Prompt Overlay */}
            <AnimatePresence>
                {showPeriodPrompt && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-20 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6 text-center bg-white/60 dark:bg-slate-900/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/30 max-w-xs w-full"
                        >
                            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-3 text-rose-500">
                                <Droplets className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Period Started?</h3>
                            <p className="text-sm text-slate-500 mb-4">It's that time of the month. Shall we log it?</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowPeriodPrompt(false); }}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    No
                                </button>
                                <button 
                                    onClick={handlePeriodStartConfirm}
                                    className="px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-500/25 transition-all"
                                >
                                    Yes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default WomenHealthWidget;
