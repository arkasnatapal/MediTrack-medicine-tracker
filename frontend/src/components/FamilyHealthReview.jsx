import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Pill, Brain, Utensils, Calendar, Shield, 
  AlertTriangle, Thermometer, CheckCircle, Heart, Zap, TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import api from '../api/api';

const FamilyHealthReview = ({ memberId, memberName }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await api.get(`/family/${memberId}/health-review`);
        if (res.data.success && res.data.exists) {
          setData(res.data.data);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Error fetching family review:", err);
        setError("Unable to load health intelligence.");
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
        fetchReview();
    }
  }, [memberId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Analyzing...</p>
         </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <p className="text-slate-900 dark:text-white font-bold">{error}</p>
        </div>
     );
  }

  if (!data) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
            <Activity className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Health Intelligence Pending</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                Once {memberName || 'this member'} has more activity data, AI insights will appear here.
            </p>
        </div>
      );
  }

  // Visual Setup
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const medicineData = data?.medicineAnalysis?.map(m => ({
    name: m.category,
    value: m.count
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Health Intelligence Review
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                   AI-powered insights for {memberName}
                </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
               Beta
            </div>
        </div>

        {/* 1. Vitality Score & Primary Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="w-32 h-32" />
                </div>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4">Vitality Score</p>
                <div className="flex items-baseline gap-4">
                    <span className="text-6xl font-black tracking-tighter">{data.healthScore}</span>
                    <span className="text-xl font-medium opacity-80">/ 100</span>
                </div>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl w-fit border border-white/20">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Health Status: {data.healthScore > 80 ? 'Excellent' : data.healthScore > 60 ? 'Good' : 'Needs Attention'}</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500">
                         <Thermometer className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Observation</span>
                   </div>
                   <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {data?.symptomsAnalysis?.probableSymptoms[0] || "No significant symptoms"}
                   </h4>
                   <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {data?.symptomsAnalysis?.explanation || "The health profile appears stable based on recent data."}
                   </p>
                </div>
                {/* Risk */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Potential Risk</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {data?.diseaseRisk?.ongoing[0] || "No immediate risks detected"}
                    </p>
                </div>
            </div>
        </div>

        {/* 2. Executive Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Executive Summary
              </h3>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {data?.summary}
              </p>
        </div>

        {/* 2.5 Future Health Prediction */}
        {data?.predictedThreat && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
             {/* Decorative Background Element */}
             <div className="absolute -right-10 -top-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
             
             <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Future Forecast</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-0.5">
                            Projection: {data.predictedThreat.timeframe || "Next 7 Days"}
                        </p>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                            {data.predictedThreat.title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {data.predictedThreat.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-colors">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Recommended Actions
                            </p>
                            <ul className="space-y-3">
                                {data.predictedThreat.suggestions?.slice(0, 2).map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm shadow-emerald-500/50" />
                                        <span className="leading-relaxed">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 </div>
             </div>
          </div>
        )}

        {/* 3. Detailed Metrics (Medicine & Nutrition) */}
        {(medicineData.length > 0 || data?.dietaryAdvice?.length > 0) && (
            <div className={`grid grid-cols-1 ${medicineData.length > 0 && data?.dietaryAdvice?.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}>
                {/* Meds */}
                {medicineData.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-purple-500" />
                            Medicine Portfolio
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                data={medicineData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                >
                                {medicineData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Nutrition */}
                {data?.dietaryAdvice && data.dietaryAdvice.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-emerald-500" />
                            Nutritional Advice
                        </h3>
                        <div className="space-y-3">
                        {data.dietaryAdvice.slice(0, 3).map((advice, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                {i + 1}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                {advice}
                            </p>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* 4. Footer */}
        <div className="text-center pt-4">
            <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                <Shield className="h-3 w-3" />
                Privacy Protected • AI Analysis
            </div>
        </div>
    </div>
  );
};

export default FamilyHealthReview;
