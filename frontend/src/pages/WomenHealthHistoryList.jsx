import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const WomenHealthHistoryList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const res = await api.get(`/women-health/${user._id}`);
                const data = res.data.data;
                if (data && data.history) {
                    setHistory(data.history);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <button 
                            onClick={() => navigate(`/women-health/${user._id}`)}
                            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cycle History</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Detailed analysis of your past menstrual cycles.
                        </p>
                    </div>
                </div>

                {/* History List */}
                {history.length > 0 ? (
                    <div className="grid gap-4">
                        {history.slice().reverse().map((item, index) => {
                            // Calculate original index for API
                            const originalIndex = history.length - 1 - index;
                            const startDate = new Date(item.start);
                            const endDate = item.end ? new Date(item.end) : null;
                            const duration = item.cycleLength || (endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : '?');

                            return (
                                <div 
                                    key={originalIndex}
                                    onClick={() => navigate(`/women-health/previous/${originalIndex}`)}
                                    className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-lg shadow-sm transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
                                    
                                    <div className="flex items-start md:items-center justify-between gap-4 relative z-10">
                                        <div className="flex items-start md:items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                                    {format(startDate, 'MMMM d, yyyy')}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    <span>
                                                        Ended: {endDate ? format(endDate, 'MMM d') : 'Ongoing'}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    <span>{duration} Days Duration</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                    
                                    {item.analysis?.summary && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-sm leading-relaxed">
                                                {item.analysis.summary}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No History Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            Complete your first cycle tracking to see detailed history analysis here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WomenHealthHistoryList;
