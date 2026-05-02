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
    let historyData = (healthData?.data?.history || [])
        .slice(0, 6)
        .reverse()
        .map((h, i) => ({
            name: `C${i + 1}`,
            length: h.cycleLength || 28
        }));

    // Fix for Recharts: if there's < 2 data points, AreaChart renders a dot. Pad it to draw a line.
    if (historyData.length === 0) {
        historyData = [{ name: 'Prev', length: 28 }, { name: 'C1', length: 28 }];
    } else if (historyData.length === 1) {
        historyData = [{ name: 'Prev', length: historyData[0].length }, ...historyData];
    }

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
        if (isPeriod) return 'from-rose-500 to-pink-500';
        if (isOvulation) return 'from-purple-500 to-indigo-500';
        return 'from-emerald-400 to-teal-500';
    };

    const StatusIcon = isPeriod ? Droplets : (isOvulation ? Sparkles : Activity);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group cursor-pointer"
            onClick={handleNavigate}
        >
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                    Women's Health
                </h3>
            </div>

            <div className="relative h-full flex flex-col md:flex-row gap-4 md:gap-6">
                
                {/* Left Section: Hero Status & Visual */}
                <div className="w-full md:w-5/12 flex flex-col justify-between relative overflow-hidden rounded-[32px] bg-[#f8fafc] dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 transition-all group-hover:border-rose-500/30">
                    {/* Background accent */}
                    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${getThemeColor()} opacity-10 blur-3xl`} />

                    <div className="z-10 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Current Phase</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1 flex items-center gap-3">
                             {healthData?.analysis?.phase || "Tracking"}
                             {isPeriod && <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                             </span>}
                        </h3>
                        <p className="text-base text-slate-500 font-medium">
                            Cycle Day {healthData?.analysis?.cycleDay || 1}
                        </p>
                    </div>

                    {/* Mini History Graph */}
                    <div className="h-28 w-full mt-6 -mx-2 z-10 relative">
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
                <div className="w-full md:w-7/12 grid grid-cols-2 gap-4">
                    {/* Next Period Card */}
                    <div className="bg-[#f8fafc] dark:bg-slate-900/50 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-3">
                            <Calendar className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">{nextDate}</div>
                        <div className="text-sm font-bold text-slate-400">Next Expected</div>
                    </div>

                     {/* Avg Length Card */}
                     <div className="bg-[#f8fafc] dark:bg-slate-900/50 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">{avgLength}d</div>
                        <div className="text-sm font-bold text-slate-400">Avg Cycle</div>
                    </div>

                    {/* Status / Prediction Card (Spans 2 cols) */}
                    <div className="col-span-2 bg-[#f8fafc] dark:bg-slate-900/50 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80">
                        <div className="flex items-center gap-4">
                            <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${getThemeColor()} text-white shadow-lg`}>
                                <StatusIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-800 dark:text-white mb-0.5">
                                    {healthData?.analysis?.status?.status || "Health Normal"}
                                </div>
                                <div className="text-sm font-bold text-slate-400">
                                    {healthData?.analysis?.status?.message || "No irregularities detected"}
                                </div>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-400">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform group-hover:text-rose-500" />
                        </div>
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
                        className="absolute inset-0 z-20 rounded-[40px] overflow-hidden flex flex-col items-center justify-center p-6 text-center bg-white/80 dark:bg-slate-900/80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700/50 max-w-sm w-full"
                        >
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500">
                                <Droplets className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Period Started?</h3>
                            <p className="text-base text-slate-500 mb-6 font-medium">It's that time of the month. Shall we log it?</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowPeriodPrompt(false); }}
                                    className="px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    Not Yet
                                </button>
                                <button 
                                    onClick={handlePeriodStartConfirm}
                                    className="px-4 py-3 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-2xl shadow-lg shadow-rose-500/25 transition-all"
                                >
                                    Log It Now
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
