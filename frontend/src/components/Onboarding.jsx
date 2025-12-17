import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Zap, Heart, Brain, Activity, Shield, Utensils, FolderOpen } from 'lucide-react';
import '../styles/onboarding.css';

import { useAuth } from '../context/AuthContext';

const Onboarding = ({ onClose, initialDelay = 1000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();

  // Check if user has already seen onboarding
  useEffect(() => {
    if (!user) return;

    const storageKey = `meditrack_onboarding_seen_${user._id || user.id}`;
    const hasSeen = localStorage.getItem(storageKey);
    
    if (!hasSeen) {
      const timer = setTimeout(() => setIsVisible(true), initialDelay);
      return () => clearTimeout(timer);
    }
  }, [initialDelay, user]);

  const handleClose = useCallback(() => {
    if (!user) return;
    
    setIsVisible(false);
    const storageKey = `meditrack_onboarding_seen_${user._id || user.id}`;
    localStorage.setItem(storageKey, 'true');
    if (onClose) onClose();
  }, [onClose, user]);

  const slides = [
    {
      id: 1,
      badge: "WELCOME TO MEDITRACK",
      title: "The Future of Health",
      description: "Experience the next generation of personal health management. Intelligent, seamless, and designed for you.",
      icon: <Sparkles className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#6366f1", // Indigo
      gradient: "from-indigo-500 to-purple-600",
      bubbleColor: "bg-indigo-600"
    },
    {
      id: 2,
      badge: "SMART REMINDERS",
      title: "Never Miss a Dose",
      description: "Intelligent scheduling that adapts to your life. Receive timely notifications via App, Email, or WhatsApp.",
      icon: <Zap className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#f59e0b", // Amber
      gradient: "from-amber-400 to-orange-600",
      bubbleColor: "bg-amber-500"
    },
    {
      id: 3,
      badge: "FAMILY CARE",
      title: "Caring for Loved Ones",
      description: "Manage medications for your entire family. Share responsibilities and ensure everyone stays healthy together.",
      icon: <Heart className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#f43f5e", // Rose
      gradient: "from-rose-400 to-pink-600",
      bubbleColor: "bg-rose-500"
    },
    {
      id: 4,
      badge: "AI ASSISTANT",
      title: "Your Personal Health AI",
      description: "Chat with our advanced AI to get instant answers about your medicines, side effects, and health tips.",
      icon: <Brain className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#06b6d4", // Cyan
      gradient: "from-cyan-400 to-blue-600",
      bubbleColor: "bg-cyan-500"
    },
    {
      id: 5,
      badge: "ANALYTICS",
      title: "Track Your Progress",
      description: "Visualize your adherence trends with beautiful charts. Understand your health patterns and stay motivated.",
      icon: <Activity className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#10b981", // Emerald
      gradient: "from-emerald-400 to-teal-600",
      bubbleColor: "bg-emerald-500"
    },
    {
      id: 6,
      badge: "FOOD ROUTINE",
      title: "Track Your Nutrition",
      description: "Log your meals and get AI-powered insights. Ensure your diet supports your medication and overall health.",
      icon: <Utensils className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#8b5cf6", // Violet
      gradient: "from-violet-500 to-purple-600",
      bubbleColor: "bg-violet-600"
    },
    {
      id: 7,
      badge: "SMART ORGANIZATION",
      title: "AI Medicine Folders",
      description: "Let AI organize your medicines into smart folders. Group by condition, type, or usage for easy access.",
      icon: <FolderOpen className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#ec4899", // Pink
      gradient: "from-pink-500 to-rose-600",
      bubbleColor: "bg-pink-600"
    },
    {
      id: 8,
      badge: "SECURE & PRIVATE",
      title: "Bank-Grade Security",
      description: "Your health data is sensitive. We use state-of-the-art encryption to ensure your information stays private.",
      icon: <Shield className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#64748b", // Slate
      gradient: "from-slate-400 to-gray-600",
      bubbleColor: "bg-slate-500"
    }
  ];

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentSlide, slides.length, handleClose]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, nextSlide, prevSlide, handleClose]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding Tour"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[1000px] h-[600px] bg-[#0B0B15] rounded-[48px] overflow-hidden shadow-2xl flex border border-white/10"
          >
            {/* Dynamic Background Glowing Bubbles */}
            <motion.div 
              animate={{ backgroundColor: slides[currentSlide].color }}
              className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full blur-[180px] opacity-20 transition-colors duration-700 pointer-events-none"
            />
            <motion.div 
              animate={{ backgroundColor: slides[currentSlide].color }}
              className="absolute bottom-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[180px] opacity-20 transition-colors duration-700 pointer-events-none"
            />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-10 right-10 z-50 p-2 text-slate-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>

            {/* Left Content Section */}
            <div className="w-1/2 p-16 flex flex-col justify-between relative z-20">
              <div>
                {/* Badge */}
                <motion.div
                  key={`badge-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 mb-10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
                    {slides[currentSlide].badge}
                  </span>
                </motion.div>

                {/* Text Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-8"
                  >
                    <h2 className="text-6xl font-bold text-white leading-[1.1] tracking-tight">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-light max-w-md">
                      {slides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between mt-10">
                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ 
                        width: currentSlide === idx ? 32 : 8,
                        backgroundColor: currentSlide === idx ? slides[currentSlide].color : '#334155'
                      }}
                      className="h-2 rounded-full transition-all duration-500"
                    />
                  ))}
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={handleClose}
                    className="text-sm font-medium text-slate-500 hover:text-white transition-colors px-2"
                  >
                    Skip
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextSlide}
                    className={`px-8 py-3.5 rounded-2xl font-bold text-white text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2.5 bg-gradient-to-r ${slides[currentSlide].gradient}`}
                  >
                    <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right Visual Section */}
            <div className="w-1/2 relative flex items-center justify-center overflow-hidden">
              {/* Premium Glass Card */}
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: "spring", duration: 1, bounce: 0.3 }}
                className="relative w-[420px] h-[420px] rounded-[60px] backdrop-blur-[40px] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: `0 0 50px ${slides[currentSlide].color}20, inset 0 0 20px rgba(255,255,255,0.05)`
                }}
              >
                {/* Dynamic Border Glow */}
                <motion.div 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-[60px]"
                  style={{
                    boxShadow: `inset 0 0 30px ${slides[currentSlide].color}30`
                  }}
                />

                {/* Inner Content Container */}
                <div className="relative w-48 h-48 rounded-[40px] flex items-center justify-center">
                  {/* Icon Background Glow */}
                  <motion.div 
                    animate={{ 
                      background: `radial-gradient(circle, ${slides[currentSlide].color}60 0%, transparent 70%)`,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-[-50%] blur-3xl opacity-50"
                  />
                  
                  {/* The Icon */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    {slides[currentSlide].icon}
                  </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute top-10 right-10 w-20 h-20 bg-white/5 rounded-full blur-xl" />
                  <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                  
                  {/* Sparkles */}
                  <Sparkles className="absolute top-16 right-16 text-white/40 w-6 h-6 animate-pulse" />
                  <Sparkles className="absolute bottom-20 left-20 text-white/20 w-4 h-4 animate-pulse delay-700" />
                  <div className="absolute top-1/2 right-12 w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
                </div>

                {/* Glass Reflection Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Onboarding;
