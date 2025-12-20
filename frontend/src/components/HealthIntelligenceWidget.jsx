import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus, ArrowRight, Sparkles, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import HealthIntelligencePanel from './HealthIntelligencePanel';

const HealthIntelligenceWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchIntelligence = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/dashboard/intelligence', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.exists) {
        setData(res.data.snapshot);
      }
    } catch (err) {
      console.error("Error fetching intelligence widget data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getStatusText = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    if (score >= 60) return { text: 'Good', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    return { text: 'Needs Attention', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' };
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

  if (loading) {
    return (
      <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 h-[320px] flex items-center justify-center overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-indigo-500/5 opacity-50" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden min-h-[320px] h-full flex flex-col group"
      >
        {/* Dynamic Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-[60px] group-hover:bg-violet-500/20 transition-colors duration-700" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg text-white">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Health IQ
              </h3>
              <p className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider">
                AI Analysis
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-300 group/btn"
          >
            <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col z-10">
          {data ? (
            <div className="flex flex-col h-full">
              {/* Score Section */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-slate-100 dark:text-slate-800"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={175}
                            strokeDashoffset={175 - (175 * data.healthScore) / 100}
                            className={`${getScoreColor(data.healthScore)} transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-black ${getScoreColor(data.healthScore)}`}>
                                {data.healthScore}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-1 ${getStatusText(data.healthScore).color}`}>
                            {getStatusText(data.healthScore).text}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                            {getTrendIcon(data.trend)}
                            <span className="capitalize">{data.trend} Trend</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* Highlights Section */}
              <div className="flex-1 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Insights</h4>
                  {data.highlights && data.highlights.slice(0, 2).map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-white/5">
                          <div className="mt-0.5">
                              <CheckCircle className="h-3.5 w-3.5 text-violet-500" />
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                              {highlight}
                          </p>
                      </div>
                  ))}
                  {(!data.highlights || data.highlights.length === 0) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          {data.summary}
                      </p>
                  )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400">
                      Updated {getRelativeTime(data.generatedAt)}
                  </span>
                  {/* <button 
                    onClick={() => setIsPanelOpen(true)}
                    className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                  >
                      <ArrowRight className="h-4 w-4" />
                  </button> */}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 mx-auto bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-violet-500 dark:text-violet-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Unlock Health IQ
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[200px]">
                Get personalized AI insights about your health trends and habits.
              </p>
              <button
                onClick={() => setIsPanelOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Generate Analysis
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <HealthIntelligencePanel 
        isOpen={isPanelOpen} 
        onClose={() => {
            setIsPanelOpen(false);
            fetchIntelligence(); 
        }} 
      />
    </>
  );
};

export default HealthIntelligenceWidget;
