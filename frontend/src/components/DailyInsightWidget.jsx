import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

const DailyInsightWidget = () => {
  const [insight, setInsight] = useState({
    title: "Your Health Journey Begins",
    content: "Welcome to MediTrack! Keep logging your medicines and reports to unlock personalized AI health insights.",
    reasoning: "Regular tracking allows our AI to identify patterns and provide you with personalized wellness strategies.",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000",
    gradient: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
    category: "nutrition"
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${API_URL}/dashboard/intelligence/daily-insight`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.insight) {
          setInsight(res.data.insight);
        }
      } catch (err) {
        console.error('Error fetching daily insight:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[40px]" />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[40px] md:rounded-[48px] overflow-hidden relative group shadow-2xl min-h-[300px] md:h-[340px] border border-white/5"
    >
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={insight.imageUrl} 
          alt="Health Insight" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1310] via-[#1a1310]/95 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div 
            key="insight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-center"
          >
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="bg-emerald-500 px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.2em]">NEW INSIGHT</p>
              </div>
            </div>

            <div className="max-w-[75%] md:max-w-2xl">
              <h3 className="text-3xl md:text-5xl font-black text-white mb-3 md:mb-4 tracking-tight leading-[1.1]">
                {insight.title}
              </h3>
              <p className="text-white/60 text-base md:text-xl leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                {insight.content}
              </p>
            </div>

            {/* Circular Action Button */}
            <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFlipped(true)}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-500 border border-emerald-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-500"
              >
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reasoning"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 h-full p-6 md:p-10 flex flex-col justify-center"
          >
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
                <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.2em]">WHY IT MATTERS</p>
              </div>
            </div>

            <div className="max-w-[75%] md:max-w-2xl">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 tracking-tight leading-tight">
                Empowering your <span className="text-emerald-400">Wellness.</span>
              </h3>
              <p className="text-white/80 text-base md:text-xl leading-relaxed font-medium">
                {insight.reasoning}
              </p>
            </div>

            {/* Circular Back Button */}
            <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFlipped(false)}
                className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-2xl border border-white/30 flex items-center justify-center text-white hover:bg-emerald-500 hover:border-emerald-400 transition-all duration-500 shadow-2xl"
              >
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 rotate-180 transition-transform duration-500" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Grain Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </motion.div>
  );
};

export default DailyInsightWidget;
