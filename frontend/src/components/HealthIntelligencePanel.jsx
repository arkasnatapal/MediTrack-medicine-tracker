import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { X, RefreshCw, Activity, TrendingUp, TrendingDown, Minus, Brain, Sparkles, Pill, FileText, ChevronRight, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: entry.color }}>
            <span className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-800" style={{ backgroundColor: entry.color }}></span>
            <span className="capitalize">{entry.name}: <span className="font-bold">{entry.value}</span></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MedicationGraph = ({ logs }) => {
  const data = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayLogs = logs.filter(l => l.scheduledTime.startsWith(date));
      const taken = dayLogs.filter(l => l.status === 'taken_on_time' || l.status === 'taken_late').length;
      const skipped = dayLogs.filter(l => l.status === 'skipped').length;
      const pending = dayLogs.filter(l => l.status === 'pending').length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        Taken: taken,
        Skipped: skipped,
        Pending: pending
      };
    });
  }, [logs]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTaken" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
          fontWeight={500}
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          allowDecimals={false}
          dx={-10}
          fontWeight={500}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
        <Line 
          type="monotone" 
          dataKey="Taken" 
          stroke="#10B981" 
          strokeWidth={3} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="Skipped" 
          stroke="#F43F5E" 
          strokeWidth={3} 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#F43F5E' }}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="Pending" 
          stroke="#94a3b8" 
          strokeWidth={2} 
          strokeDasharray="5 5" 
          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#94a3b8' }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const HealthIntelligencePanel = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [medLogs, setMedLogs] = useState([]);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/dashboard/intelligence`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.exists) {
        setData(res.data.snapshot);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("Error fetching intelligence", err);
      setError("Could not load health intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/medicine-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMedLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Error fetching med logs for graph", err);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage('');
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/dashboard/intelligence/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.updated) {
        setData(res.data.snapshot);
        setMessage("Insights refreshed successfully.");
      } else {
        setMessage(res.data.message || "Insights are already up to date.");
      }
    } catch (err) {
      console.error("Error refreshing intelligence", err);
      setError("Failed to refresh insights.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIntelligence();
      fetchMedLogs();
    }
  }, [isOpen]);

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-rose-500" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    isOpen && (
      <div className="fixed inset-x-0 bottom-0 top-20 z-[40] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop with Blur */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 transition-opacity"
        />
        
        {/* Modal Container */}
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Health Intelligence</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI-Powered Analysis</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Synthesizing Health Data</p>
                  <p className="text-slate-500 dark:text-slate-400">Analyzing patterns and generating insights...</p>
                </div>
              </div>
            ) : data ? (
              <div className="space-y-8 max-w-7xl mx-auto">
                {/* Women's Health Card (Top Priority if Exists) */}
                {data.womenHealth && (
                   <div className="lg:col-span-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 border border-rose-100 dark:border-rose-900/20 shadow-sm transition-all duration-300 hover:shadow-md group p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                               <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                                  data.womenHealth.status === 'Critical Alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                  data.womenHealth.status === 'High Irregularity' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                  data.womenHealth.status === 'Monitor' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                               }`}>
                                  <Sparkles className="w-3 h-3" />
                                  {data.womenHealth.status || "Women's Health"}
                               </div>
                               <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Cycle Trend
                               </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                               Reproductive Health Insight
                            </h3>
                            
                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
                               {data.womenHealth.recommendation || "Tracking your cycle patterns for health insights."}
                            </p>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                   <div className="w-2 h-2 rounded-full bg-rose-400" />
                                   Avg Length: <span className="text-slate-900 dark:text-white font-bold">{data.womenHealth.averageLength || '?'} Days</span>
                               </div>
                               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                   <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                   History: <span className="text-slate-900 dark:text-white font-bold">{data.womenHealth.historyCount || 0} Cycles</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Hero Section: Future Prediction & Domain Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Future Health Prediction Layer */}
                  {data.predictedThreat ? (
                    <div className="lg:col-span-12 relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-sm transition-all duration-300 hover:shadow-md group">
                      {/* Severity Indicator Bar */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        data.predictedThreat.severity === 'high' ? 'bg-rose-500' : 
                        data.predictedThreat.severity === 'medium' ? 'bg-amber-500' :
                        data.predictedThreat.severity === 'good' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                          {/* Left: Headline & Status */}
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-4">
                               <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                                  data.predictedThreat.severity === 'high' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                                  data.predictedThreat.severity === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                               }`}>
                                  {data.predictedThreat.severity === 'high' ? <AlertTriangle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                  {data.predictedThreat.severity === 'high' ? 'Elevated Risk' : 
                                   data.predictedThreat.severity === 'medium' ? 'Moderate Risk' : 'Good Trajectory'}
                               </div>
                               <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {data.predictedThreat.timeframe || "Upcoming"}
                               </span>
                             </div>

                             <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                               {data.predictedThreat.title || "Health Trajectory Analysis"}
                             </h3>
                             
                             <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
                               {data.predictedThreat.description}
                             </p>

                             {/* Suggestions (Horizontal) */}
                             {data.predictedThreat.suggestions?.length > 0 && (
                               <div className="flex flex-wrap gap-2">
                                  {data.predictedThreat.suggestions.map((s, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                                      {s}
                                    </span>
                                  ))}
                               </div>
                             )}
                          </div>

                          {/* Right: Prediction Basis (Explainability) */}
                          <div className="w-full md:w-72 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800/50">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Brain className="w-3 h-3" />
                               Prediction Basis
                             </h4>
                             <ul className="space-y-2">
                                {data.predictedThreat.predictionBasis?.map((basis, i) => (
                                   <li key={i} className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                      <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                                      {basis}
                                   </li>
                                )) || (
                                  <li className="text-xs text-slate-400 italic">Based on current clinical data trends.</li>
                                )}
                             </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Fallback Positive State
                    <div className="lg:col-span-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/20 shadow-sm p-8">
                       <div className="flex items-center gap-4">
                           <div className="p-3 rounded-full bg-white dark:bg-emerald-900/30 text-emerald-500 shadow-sm">
                             <Sparkles className="w-6 h-6" />
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Stable Future Trajectory</h3>
                             <p className="text-slate-600 dark:text-slate-400">Not enough data changes to predict new risks.</p>
                           </div>
                       </div>
                    </div>
                  )}

                  {/* Domain Insights Grid */}
                  {data.domains && Object.keys(data.domains).length > 0 ? (
                    <div className="lg:col-span-12 space-y-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal-500" />
                        Domain Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(data.domains).map(([domainName, domainData], idx) => (
                           <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{domainName}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                      domainData.trend === 'improving' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      domainData.trend === 'declining' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                      {domainData.trend}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400">Updated {getRelativeTime(domainData.lastAnalyzedAt)}</p>
                                </div>
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-4 ${getScoreGradient(domainData.healthScore)}`}>
                                  <span className={`text-sm font-bold ${getScoreColor(domainData.healthScore)}`}>{domainData.healthScore}</span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 min-h-[40px]">
                                {domainData.summary}
                              </p>

                              {domainData.keyFindings && domainData.keyFindings.length > 0 && (
                                <div className="space-y-2">
                                  {domainData.keyFindings.slice(0, 2).map((finding, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 shrink-0"></span>
                                      <span>{finding}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Fallback / "All Good" if no domains
                    <div className="lg:col-span-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                        <div className="relative p-8 flex items-center gap-6">
                            <div className="p-3 rounded-xl bg-white dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 shadow-sm">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                                    Ready for Analysis
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                                    Upload medical reports to get domain-specific insights.
                                </p>
                            </div>
                        </div>
                    </div>
                  )}
                  {/* Score Card */}
                  <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-indigo-500/10"></div>
                    
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className="relative w-48 h-48 mb-8 group-hover:scale-105 transition-transform duration-500">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                          <circle 
                            cx="96" cy="96" r="84" 
                            stroke="currentColor" strokeWidth="12" 
                            fill="transparent" 
                            strokeDasharray={527} 
                            strokeDashoffset={527 - (527 * data.healthScore) / 100} 
                            className={`${getScoreGradient(data.healthScore)}`}
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-6xl font-black ${getScoreColor(data.healthScore)} tracking-tighter`}>{data.healthScore}</span>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Health Score</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 transition-colors">
                        {getTrendIcon(data.trend)}
                        <span className="text-base font-bold text-slate-700 dark:text-slate-300 capitalize">{data.trend} Trend</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Progression */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Self-Reported Health Trend Card */}
                    {data.selfReportedTrend && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                            <div className={`p-4 rounded-2xl ${
                                data.selfReportedTrend.trend === 'improving' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                data.selfReportedTrend.trend === 'declining' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' :
                                'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                                {data.selfReportedTrend.trend === 'improving' ? <TrendingUp className="w-8 h-8" /> : 
                                 data.selfReportedTrend.trend === 'declining' ? <TrendingDown className="w-8 h-8" /> : 
                                 <Minus className="w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    Self-Reported Trend
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                                    {data.selfReportedTrend.summary || "No subjective data yet."}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Based on your daily reviews • {data.selfReportedTrend.trend.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    )}

                    {data.progressionNote && (
                      <div className="flex-1 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-8 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Progression Insight</h3>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-medium">
                          {data.progressionNote}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Executive Summary</h3>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                        {data.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two Column Layout for Highlights & Meds */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Highlights */}
                  {data.highlights && data.highlights.length > 0 && (
                    <div className="space-y-5">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 px-2">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                        Key Highlights
                      </h3>
                      <div className="grid gap-4">
                        {data.highlights.map((highlight, idx) => (
                          <div key={idx} className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900/50 transition-all duration-300">
                            <div className="flex gap-4">
                              <div className="mt-2 w-2.5 h-2.5 rounded-full bg-amber-400 group-hover:bg-amber-500 shadow-sm group-hover:shadow-amber-200 transition-all shrink-0" />
                              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{highlight}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Medication Analysis */}
                  {data.medicationInsights && data.medicationInsights.length > 0 && (
                    <div className="space-y-5">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 px-2">
                        <Pill className="w-6 h-6 text-indigo-500" />
                        Medication Analysis
                      </h3>
                      <div className="grid gap-4">
                        {data.medicationInsights.map((insight, idx) => (
                          <div key={idx} className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300">
                            <div className="flex gap-4">
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl h-fit text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                <Activity className="w-4 h-4" />
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{insight}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Medication Graph Section */}
                {medLogs.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adherence Trends</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">7-day medication intake overview</p>
                      </div>
                      <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Last 7 Days
                      </div>
                    </div>
                    <div className="h-80 w-full">
                      <MedicationGraph logs={medLogs} />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Generated {getRelativeTime(data.generatedAt)}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>Version {data.version}</span>
                  </div>
                  
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="group flex items-center gap-2.5 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {refreshing ? 'Analyzing...' : 'Refresh Insights'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center max-w-2xl mx-auto">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-slate-800/50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                  <Activity className="w-16 h-16 text-indigo-500/50" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">No Insights Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
                  Generate your first health intelligence snapshot to unlock personalized insights, trend analysis, and AI-powered recommendations.
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold overflow-hidden transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-all group-hover:scale-105"></div>
                  <span className="relative flex items-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    Generate Analysis
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default HealthIntelligencePanel;
