import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, Activity, AlertCircle, FileText } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { format, differenceInDays } from 'date-fns';

const WomenHealthHistoryDetail = () => {
    const { index } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(true);
    const [historyItem, setHistoryItem] = useState(null);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const res = await api.get(`/women-health/${user._id}`);
                const data = res.data.data;
                
                if (data && data.history && data.history[index]) {
                    const item = data.history[index];
                    setHistoryItem(item);
                    
                    // Filter logs for this period
                    const start = new Date(item.start);
                    const end = item.end ? new Date(item.end) : new Date();
                    
                    const periodLogs = data.dailyLogs?.filter(l => {
                        const logDate = new Date(l.date);
                        return logDate >= start && logDate <= end;
                    }) || [];
                    
                    setLogs(periodLogs);
                } else {
                    notify.error("History record not found");
                    navigate('/women-health');
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                notify.error("Failed to load history details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, index, navigate, notify]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this history record? This cannot be undone.")) return;

        try {
            await api.delete(`/women-health/${user._id}/history/${index}`);
            notify.success("Record deleted successfully");
            navigate('/women-health/history');
        } catch (error) {
            console.error("Delete Error:", error);
            notify.error("Failed to delete record");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!historyItem) return null;

    const startDate = new Date(historyItem.start);
    const endDate = historyItem.end ? new Date(historyItem.end) : null;
    const duration = endDate ? differenceInDays(endDate, startDate) + 1 : 'Active';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => navigate(`/women-health/${user._id}`)}
                        className="flex items-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center text-red-500 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Record
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    
                    {/* Hero Section */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Cycle Analysis</h1>
                                <div className="text-slate-500 dark:text-slate-400 flex items-center space-x-4">
                                    <span className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1.5" />
                                        {format(startDate, 'MMM d, yyyy')} - {endDate ? format(endDate, 'MMM d, yyyy') : 'Ongoing'}
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                    <span>{duration} Days Duration</span>
                                </div>
                            </div>
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="p-8 space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                                AI Insight
                            </h2>
                            <div className="bg-indigo-50 dark:bg-slate-700/50 rounded-xl p-6 border border-indigo-100 dark:border-slate-600">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                                    {historyItem.analysis?.summary || "No detailed analysis available for this cycle."}
                                </p>
                            </div>
                        </div>

                        {/* Symptoms Logged */}
                        {logs.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Daily Logs Timeline</h2>
                                <div className="space-y-4">
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 bg-indigo-500 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-900/20 group-hover:scale-110 transition-transform"></div>
                                                {i !== logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1"></div>}
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                                    {format(new Date(log.date), 'EEEE, MMM d')}
                                                </p>
                                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {log.symptoms?.map(s => (
                                                            <span key={s} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-xs rounded-md font-medium border border-rose-100 dark:border-rose-900/30">
                                                                {s}
                                                            </span>
                                                        ))}
                                                        {log.mood && (
                                                            <span className="px-2 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 text-xs rounded-md font-medium border border-sky-100 dark:border-sky-900/30">
                                                                Mood: {log.mood}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {log.notes && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{log.notes}"</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {logs.length === 0 && (
                             <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No daily logs recorded for this period.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WomenHealthHistoryDetail;
