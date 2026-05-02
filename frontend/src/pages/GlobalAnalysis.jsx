import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  ChevronLeft,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  Brain,
  History,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  HeartPulse
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import api from "../api/api";
import MarkdownRenderer from "../components/MarkdownRenderer";

const GlobalAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchHistory();
    if (location.state?.runNew) {
      runAnalysis();
      // Clear state so it doesn't run again on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ai/global-analysis");
      if (res.data.success) {
        setHistory(res.data.history);
        if (res.data.history.length > 0 && !analyzing) {
          setSelectedAnalysis(res.data.history[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching global analysis history:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await api.post("/ai/global-analysis");
      if (res.data.success) {
        const newRecord = res.data.analysis;
        setHistory(prev => [newRecord, ...prev]);
        setSelectedAnalysis(newRecord);
      }
    } catch (err) {
      console.error("Error running global analysis:", err);
      alert("Failed to run global analysis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-teal-500/30 shadow-xl">
          <p className="text-teal-400 font-bold mb-1">{payload[0].payload.name}</p>
          <p className="text-white text-lg">{payload[0].value} / 100</p>
        </div>
      );
    }
    return null;
  };

  if (loading && !analyzing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] font-sans">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <button 
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 text-teal-200 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Reports
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 flex items-center gap-4">
              <Activity className="w-10 h-10 text-teal-400" />
              Global Health Analysis
            </h1>
            <p className="text-teal-100/80 max-w-xl text-lg">
              A comprehensive synopsis of your entire health ecosystem, cross-referencing your reports, diet, and medications.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-end gap-4">
             <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-2xl shadow-xl hover:shadow-teal-500/25 transition-all flex items-center gap-3 disabled:opacity-50"
             >
               {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
               Run New Checkup
             </button>
             {history.length > 0 && (
               <div className="relative group">
                 <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-all flex items-center gap-2 border border-white/10">
                   <History className="w-4 h-4" /> View History
                 </button>
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                   <div className="max-h-64 overflow-y-auto custom-scrollbar">
                     {history.map(item => (
                       <button
                         key={item._id}
                         onClick={() => setSelectedAnalysis(item)}
                         className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${selectedAnalysis?._id === item._id ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-gray-700 dark:text-gray-300'}`}
                       >
                         <div className="font-medium flex items-center justify-between">
                           <span>Score: {item.healthScore}</span>
                           <span className="text-xs opacity-60">
                             {new Date(item.createdAt).toLocaleDateString()}
                           </span>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Content Area */}
        {analyzing ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-700"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-20 animate-pulse" />
              <Brain className="w-20 h-20 text-teal-500 animate-bounce relative z-10" />
            </div>
            <h3 className="text-2xl font-bold mt-8 text-gray-900 dark:text-white">Analyzing Your Health Ecosystem</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
              Our AI is currently cross-referencing your medical reports, daily diet, and medication adherence to build a complete health profile...
            </p>
          </motion.div>
        ) : selectedAnalysis ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedAnalysis._id}
              initial="hidden" animate="show" exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              {/* Left Column: Visuals & Score */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="lg:col-span-1 space-y-8 sticky top-8"
              >
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-50/50 dark:to-teal-900/10 pointer-events-none" />
                  <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-4 uppercase tracking-wider text-sm relative z-10">Overall Health Score</h3>
                  <div className="relative flex items-center justify-center z-10">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-slate-700" />
                      <circle 
                        cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={552.92} 
                        strokeDashoffset={552.92 - (552.92 * selectedAnalysis.healthScore) / 100}
                        strokeLinecap="round"
                        className={`${selectedAnalysis.healthScore >= 80 ? 'text-emerald-500' : selectedAnalysis.healthScore >= 60 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`} 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{selectedAnalysis.healthScore}</span>
                      <span className="text-sm text-gray-500 font-medium mt-1">out of 100</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-6 relative z-10">
                    Analyzed on {new Date(selectedAnalysis.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-500" /> Domain Analysis
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedAnalysis.domains}>
                        <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Health Domains"
                          dataKey="score"
                          stroke="#14b8a6"
                          strokeWidth={3}
                          fill="#14b8a6"
                          fillOpacity={0.3}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Detailed Textual Analysis */}
              <div className="lg:col-span-2 space-y-8">
                {/* Synopsis */}
                <motion.div 
                  variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-800/30"
                >
                  <h3 className="text-indigo-900 dark:text-indigo-300 font-bold text-xl mb-4 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    Overall Synopsis
                  </h3>
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-indigo text-gray-700 dark:text-gray-300">
                    <MarkdownRenderer content={selectedAnalysis.synopsis} />
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Flaws */}
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm transition-all"
                  >
                    <h3 className="text-rose-900 dark:text-rose-300 font-bold text-lg mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" /> Detected Flaws
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-rose-800/80 dark:text-rose-200/80 text-sm">
                      <MarkdownRenderer content={selectedAnalysis.flaws} />
                    </div>
                  </motion.div>

                  {/* Causes */}
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] p-8 border border-amber-100 dark:border-amber-900/30 shadow-sm transition-all"
                  >
                    <h3 className="text-amber-900 dark:text-amber-300 font-bold text-lg mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Possible Causes
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-amber-800/80 dark:text-amber-200/80 text-sm">
                      <MarkdownRenderer content={selectedAnalysis.causes} />
                    </div>
                  </motion.div>

                  {/* Coping */}
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-sky-50 dark:bg-sky-950/20 rounded-[2rem] p-8 border border-sky-100 dark:border-sky-900/30 shadow-sm transition-all"
                  >
                    <h3 className="text-sky-900 dark:text-sky-300 font-bold text-lg mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" /> Coping Mechanisms
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-sky-800/80 dark:text-sky-200/80 text-sm">
                      <MarkdownRenderer content={selectedAnalysis.copingMechanisms} />
                    </div>
                  </motion.div>

                  {/* Prevention */}
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] p-8 border border-emerald-100 dark:border-emerald-900/30 shadow-sm transition-all"
                  >
                    <h3 className="text-emerald-900 dark:text-emerald-300 font-bold text-lg mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" /> Prevention Strategies
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-emerald-800/80 dark:text-emerald-200/80 text-sm">
                      <MarkdownRenderer content={selectedAnalysis.prevention} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-16 shadow-sm border border-gray-100 dark:border-slate-700 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mb-6">
              <HeartPulse className="w-12 h-12 text-teal-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Global Analysis Found</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
              You haven't run a global health analysis yet. Click the button above to cross-reference all your health data into a complete wellness report.
            </p>
            <button
              onClick={runAnalysis}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl transition-all"
            >
              Start First Checkup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalAnalysis;
