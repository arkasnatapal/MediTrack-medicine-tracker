// [Modified FoodDetail.jsx content]
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Heart, Flame, Activity, ChevronRight, 
  ChefHat, AlertCircle, Info, Sparkles 
} from "lucide-react";
import Loader from "../components/Loader";

const API_URL = import.meta.env.VITE_API_URL;

const FoodDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsight();
  }, [name]);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await axios.get(`${API_URL}/food/insight/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load food details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-slate-500 font-medium animate-pulse">Consulting the AI Nutritionist...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Oops!</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">{error || "Data unavailable"}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300"
        >
            Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] pb-20 font-sans selection:bg-indigo-500/30">
      {/* --- HEADER SECTION --- */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] pt-24 pb-32 overflow-hidden px-6 lg:px-12 transition-colors duration-500">
         {/* Abstract Decorations */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-200/40 dark:bg-teal-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

         <div className="relative z-10 max-w-5xl mx-auto">
             <button 
                onClick={() => navigate(-1)}
                className="group mb-8 p-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl text-slate-700 dark:text-white/80 hover:bg-white/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border border-indigo-100 dark:border-white/5 flex items-center justify-center w-12 h-12 shadow-lg shadow-black/5"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>

            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="flex flex-wrap gap-3 mb-6">
                    {data.tags?.map((tag, i) => (
                        <span key={i} className="px-4 py-1.5 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-indigo-100 dark:border-white/10 text-teal-700 dark:text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-800 to-indigo-900 dark:from-white dark:via-indigo-100 dark:to-indigo-300 mb-8 capitalize leading-tight drop-shadow-sm">
                    {data.dishName}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-700 dark:text-white/90 font-medium text-lg">
                   <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-indigo-100 dark:border-white/10 backdrop-blur-sm shadow-xl shadow-indigo-500/5 dark:shadow-black/5">
                      <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                        <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                      </div>
                      <span className="font-bold tracking-tight">{data.calories}</span>
                   </div>
                   
                   <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-indigo-100 dark:border-white/10 backdrop-blur-sm shadow-xl shadow-indigo-500/5 dark:shadow-black/5 ${data.healthScore >= 8 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      <div className={`p-2 rounded-lg ${data.healthScore >= 8 ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
                        <Activity className="w-5 h-5" />
                      </div>
                       <div className="flex items-baseline gap-1">
                          <span className="text-sm uppercase tracking-wider font-bold opacity-80 text-slate-500 dark:text-white">Score</span>
                          <span className="text-xl font-bold">{data.healthScore}</span>
                          <span className="text-sm opacity-60">/10</span>
                       </div>
                   </div>
                </div>
            </motion.div>
         </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20 space-y-8">
         
         {/* HEALTH IMPACT CARD */}
         <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="group relative bg-white dark:bg-[#111827] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-indigo-100/50 dark:shadow-black/50 border border-indigo-100 dark:border-slate-800 overflow-hidden"
         >
             <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-500/10 transition-colors duration-700" />
             
            <div className="relative flex flex-col md:flex-row items-start gap-6">
                <div className="p-5 bg-teal-50 dark:bg-teal-900/20 rounded-3xl text-teal-600 dark:text-teal-400 shrink-0 shadow-sm border border-teal-100 dark:border-teal-900/50">
                    <Heart className="w-8 h-8" />
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-teal-500" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Personalized Analysis</h2>
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">How this affects you</h3>
                   <div className="prose prose-lg dark:prose-invert text-slate-600 dark:text-slate-300 leading-relaxed max-w-none">
                      {data.healthImpact}
                   </div>
                </div>
            </div>
         </motion.div>

         {/* STATS GRID */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             {Object.entries(data.nutrients || {}).map(([key, val], idx) => (
                 <motion.div 
                    key={key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + (idx * 0.05) }}
                    className="group bg-white dark:bg-[#111827] p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 text-center hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
                 >
                    <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{val}</div>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider group-hover:text-slate-500 dark:group-hover:text-slate-300">{key}</div>
                 </motion.div>
             ))}
         </div>

         {/* RECIPE SECTION */}
         <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-8 lg:p-12 shadow-xl border border-indigo-100 dark:border-slate-800"
         >
             <div className="flex items-center gap-4 mb-10 pb-6 border-b border-indigo-100 dark:border-slate-800">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                    <ChefHat className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Preparation</h2>
                    <p className="text-slate-500 font-medium">Step-by-step guide</p>
                </div>
             </div>

             <div className="space-y-12 relative pl-8 border-l-2 border-indigo-100 dark:border-slate-800 ml-4 lg:ml-6">
                 {data.recipe?.map((step, idx) => (
                     <div key={idx} className="relative group">
                         <span className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-indigo-50 dark:bg-[#111827] border-[3px] border-indigo-200 dark:border-slate-700 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                         </span>
                         
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
                            <span className="text-slate-300 dark:text-slate-600 text-sm font-black uppercase tracking-widest group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Step {idx + 1}</span>
                         </h3>
                         <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                            {step}
                         </p>
                     </div>
                 ))}
             </div>
         </motion.div>

         <div className="h-12" /> {/* Bottom Spacer */}
      </div>
    </div>
  );
};

export default FoodDetail;
