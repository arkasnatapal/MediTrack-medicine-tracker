import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, ChevronRight, Clock, Award, AlertTriangle, Apple, Dumbbell } from "lucide-react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Loader from "./Loader";

const API_URL = import.meta.env.VITE_API_URL;

const WeeklyNutritionModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null); // Current Report
  const [history, setHistory] = useState([]);
  const [viewHistory, setViewHistory] = useState(false);
  const [canGenerate, setCanGenerate] = useState(true);
  const [nextAvailable, setNextAvailable] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/nutrition/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.history);
        setCanGenerate(res.data.canGenerate);
        setNextAvailable(res.data.nextAvailable);
        
        // If there's a recent report that is still valid (generated today), fetch it to show by default
        if (!res.data.canGenerate && res.data.history.length > 0) {
           // We could separate 'latest' endpoint or just re-fetch latest logic
           // For now, let's fetch the full latest report
           fetchLatestReport();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestReport = async () => {
      try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_URL}/nutrition/latest`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if(res.data.success && res.data.data) {
              setData(res.data.data);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  }

  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/nutrition/analyze-weekly`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setData(res.data.data);
        setCanGenerate(false);
        // Update history locally
        setHistory([res.data.data, ...history]);
        // Calculate new next available time (24h from now)
        setNextAvailable(new Date(Date.now() + 24 * 60 * 60 * 1000));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate report.");
      if (err.response?.status === 429) {
          setCanGenerate(false);
          setNextAvailable(err.response.data.nextAvailable);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-500" />
              Nutri-Scan Analysis
            </h2>
            <p className="text-sm text-slate-500">Weekly nutritional breakdown & health impact</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <Loader />
               <p className="text-slate-500 animate-pulse">Analyzing your nutrition profile...</p>
             </div>
          ) : error ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analysis Failed</h3>
                <p className="text-slate-500">{error}</p>
            </div>
          ) : !data && !viewHistory ? (
             // Initial State
             <div className="text-center py-20">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-teal-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Weekly Health Snapshot</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                   Generate a detailed report of your nutrient intake, recovery impact, and personalized food recommendations relative to your health condition.
                </p>
                
                {canGenerate ? (
                    <button 
                        onClick={generateReport}
                        className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        Generate Analysis
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold">
                        <Clock className="w-5 h-5" />
                        Next scan available: {nextAvailable ? new Date(nextAvailable).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Tomorrow'}
                    </div>
                )}
                
                {history.length > 0 && (
                    <div className="mt-8">
                        <button onClick={() => setViewHistory(true)} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                            View Past Reports
                        </button>
                    </div>
                )}
             </div>
          ) : viewHistory ? (
              // History View
              <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analysis History</h3>
                      <button onClick={() => setViewHistory(false)} className="text-sm font-bold text-teal-600 dark:text-teal-400">Back to Current</button>
                  </div>
                  {history.map((record) => (
                      <div key={record._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                           onClick={() => { setData(record); setViewHistory(false); }} // Load historic report
                      >
                          <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {new Date(record.generatedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-slate-500">
                                  Impact Score: {record.diseaseAnalysis?.impactScore}/10
                              </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                  ))}
              </div>
          ) : (
             // Report View
             <div className="animate-in fade-in zoom-in duration-300 space-y-8">
                 {/* Top Summary Card */}
                 <div className="p-6 bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-indigo-900/20 dark:to-teal-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                     <div className="flex items-start justify-between gap-4 mb-4">
                         <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Weekly Summary</h3>
                             <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                                {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
                             </div>
                         </div>
                         <div className="px-4 py-2 bg-white dark:bg-white/10 rounded-xl shadow-sm">
                             <span className="block text-xs text-slate-400 font-bold uppercase">Impact Score</span>
                             <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{data.diseaseAnalysis?.impactScore}<span className="text-sm text-slate-400">/10</span></span>
                         </div>
                     </div>
                     <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                         {data.summary}
                     </p>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Macro Chart */}
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                         <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <Dumbbell className="w-5 h-5 text-emerald-500" />
                             Nutrient Breakdown
                         </h4>
                         <div className="h-64 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                     <Pie
                                         data={data.visualData}
                                         cx="50%"
                                         cy="50%"
                                         innerRadius={60}
                                         outerRadius={80}
                                         paddingAngle={5}
                                         dataKey="value"
                                     >
                                         {data.visualData?.map((entry, index) => (
                                             <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                         ))}
                                     </Pie>
                                     <Tooltip 
                                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                     />
                                     <Legend verticalAlign="bottom" height={36}/>
                                 </PieChart>
                             </ResponsiveContainer>
                         </div>
                         <div className="grid grid-cols-3 gap-2 mt-4">
                             {Object.entries(data.macroBreakdown || {}).slice(0, 3).map(([key, val]) => (
                                 <div key={key} className="text-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                     <div className="text-xs text-slate-400 uppercase font-bold">{key}</div>
                                     <div className="font-bold text-slate-700 dark:text-slate-200">{val}g</div>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Disease Impact */}
                     <div className="space-y-6">
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                             <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                 <Award className="w-5 h-5 text-amber-500" />
                                 Recovery & Impact
                             </h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                 Effect on <span className="font-bold text-indigo-500">{data.diseaseAnalysis?.condition}</span>
                             </p>
                             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-700 dark:text-indigo-300 text-sm leading-relaxed">
                                 {data.diseaseAnalysis?.explanation}
                             </div>
                         </div>

                         <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                             <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                 <Apple className="w-5 h-5 text-rose-500" />
                                 Star Foods
                             </h4>
                             <div className="flex flex-wrap gap-2">
                                 {data.diseaseAnalysis?.beneficialFoods?.map((food, i) => (
                                     <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
                                         {food}
                                     </span>
                                 ))}
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 {/* Footer Actions */}
                 <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                     <button onClick={() => setViewHistory(true)} className="text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                         View History
                     </button>
                     {!canGenerate && (
                         <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                             Next scan: {new Date(nextAvailable).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                     )}
                 </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WeeklyNutritionModal;
