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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowModal(true)}
        className="w-full rounded-[48px] overflow-hidden relative group cursor-pointer shadow-2xl h-[340px] border border-white/5"
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={insight.imageUrl} 
            alt="Health Insight" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          {/* Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1310] via-[#1a1310]/90 to-transparent" />
        </div>

        <div className="relative z-10 h-full p-10 flex flex-col justify-center max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">INSIGHT</p>
            </div>
          </div>

          <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-[1.1]">
            {insight.title}
          </h3>
          <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-lg font-medium">
            {insight.content}
          </p>

          {/* Circular Action Button */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-2xl border border-white/30 flex items-center justify-center text-white group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all duration-500 shadow-2xl"
            >
              <ArrowRight className="w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </motion.button>
          </div>
        </div>

        {/* Subtle Grain Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </motion.div>

      {/* Reasoning Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/30">
                  <Lightbulb className="w-8 h-8 text-emerald-400" />
                </div>
                
                <h4 className="text-2xl font-black text-white mb-4">Why this matters?</h4>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  {insight.reasoning}
                </p>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyInsightWidget;
