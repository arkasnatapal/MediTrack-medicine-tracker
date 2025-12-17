import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight, Pill, Bot, Activity, Utensils, FolderOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Mouse move effect for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set((clientX - left) / width - 0.5);
    mouseY.set((clientY - top) / height - 0.5);
  };

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 20, stiffness: 100 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { damping: 20, stiffness: 100 });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden perspective-1000">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-1/4 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px] mix-blend-screen animate-pulse-slow delay-1000"></div>
        <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-teal-500/20 blur-[120px] mix-blend-screen animate-pulse-slow delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Content */}
        <motion.div
          style={{ y, opacity }}
          className="text-center lg:text-left space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium backdrop-blur-md shadow-lg shadow-emerald-500/10 hover:bg-white/10 transition-colors cursor-default"
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span>AI-Powered Health Companion</span>
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white"
            >
              Your Health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-gradient-x">
                Intelligently Managed
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Experience the next generation of healthcare. From <strong>AI-organized medicine folders</strong> to <strong>smart food tracking</strong>, MediTrack empowers you to live healthier, effortlessly.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <Link to="/ai-assistant" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg backdrop-blur-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-5 h-5 text-emerald-400" />
                Try AI Assistant
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center lg:justify-start gap-6 pt-6 border-t border-white/5 mt-8"
          >
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">10k+</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Active Users</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">98%</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Adherence Rate</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">24/7</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">AI Support</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - 3D Interactive Mockup */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative hidden lg:block h-[600px] w-full"
        >
          {/* Main Glass Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden transform-gpu group">
            {/* Header Mockup */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="h-2 w-32 bg-white/10 rounded-full" />
            </div>
            
            {/* Body Mockup */}
            <div className="p-8 grid grid-cols-3 gap-6 h-[calc(100%-4rem)]">
              {/* Sidebar Mockup */}
              <div className="col-span-1 space-y-4 border-r border-white/5 pr-6">
                <div className="h-10 w-full bg-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center px-3 gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500/50" />
                  <div className="h-2 w-16 bg-emerald-500/30 rounded" />
                </div>
                <div className="space-y-2 pt-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 w-full bg-white/5 rounded-lg hover:bg-white/10 transition-colors" />
                  ))}
                </div>
              </div>
              
              {/* Content Mockup */}
              <div className="col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-4 relative overflow-hidden">
                    <Activity className="absolute top-3 right-3 text-emerald-500/40" size={20} />
                    <div className="h-2 w-12 bg-emerald-500/30 rounded mb-4" />
                    <div className="h-6 w-20 bg-emerald-500/50 rounded" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-2xl border border-white/5 p-4">
                    <div className="h-2 w-12 bg-white/20 rounded mb-4" />
                    <div className="h-6 w-16 bg-white/30 rounded" />
                  </div>
                </div>
                
                {/* Main Graph Area */}
                <div className="h-48 bg-white/5 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-500/10 to-transparent" />
                   <svg className="w-full h-full text-emerald-500/50" viewBox="0 0 100 40" preserveAspectRatio="none">
                     <path d="M0 35 Q 20 20 40 30 T 80 10 T 100 20 V 40 H 0 Z" fill="currentColor" />
                     <path d="M0 35 Q 20 20 40 30 T 80 10 T 100 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                   </svg>
                </div>

                {/* List Items */}
                <div className="space-y-3">
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Pill size={16} className="text-blue-400" />
                    </div>
                    <div className="h-2 w-24 bg-white/20 rounded" />
                  </div>
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Utensils size={16} className="text-purple-400" />
                    </div>
                    <div className="h-2 w-32 bg-white/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements - Enhanced with new features */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 top-24 p-4 bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-900/50 z-20 w-72"
            style={{ transform: "translateZ(60px)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 ring-1 ring-emerald-500/40">
                <Bot size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AI Health Assistant</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Analyzing Diet...
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
              "Based on your breakfast, I recommend taking your <strong>Vitamin D</strong> now for better absorption."
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-12 bottom-32 p-4 bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/50 z-20 w-64"
            style={{ transform: "translateZ(80px)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen size={16} className="text-purple-400" />
                Smart Folders
              </div>
              <div className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Auto-Sorted</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-slate-300">Heart Medications</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-slate-300">Daily Vitamins</span>
              </div>
            </div>
          </motion.div>

          {/* Glows */}
          <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl -z-10 rounded-full opacity-40 animate-pulse-slow" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
