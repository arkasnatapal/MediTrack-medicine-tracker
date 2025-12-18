import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Bot, Info, Activity, Heart, ChevronRight } from 'lucide-react';
import '../styles/onboarding.css';

const AIChatOnboarding = ({ onClose, initialDelay = 1000, forceOpen = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }

    try {
      const hasSeen = localStorage.getItem('meditrack_ai_onboarding_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => setIsVisible(true), initialDelay);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, [initialDelay, forceOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    try {
      localStorage.setItem('meditrack_ai_onboarding_seen', 'true');
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
    if (onClose) onClose();
  }, [onClose]);

  const slides = [
    {
      id: 1,
      badge: "AI HEALTH ASSISTANT",
      title: "Your 24/7 Companion",
      description: "I'm here to assist you anytime with medical questions, drug interactions, and general health advice.",
      icon: <Bot className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#10b981", // Emerald
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      id: 2,
      badge: "MEDICINE INFO",
      title: "Know Your Meds",
      description: "Not sure about a pill? Ask me about dosages, side effects, and how to take your medication safely.",
      icon: <Info className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#3b82f6", // Blue
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      id: 3,
      badge: "SYMPTOM CHECKER",
      title: "Feeling Unwell?",
      description: "Describe your symptoms, and I'll provide preliminary insights and guidance on what to do next.",
      icon: <Activity className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#f59e0b", // Amber
      gradient: "from-amber-400 to-orange-600"
    },
    {
      id: 4,
      badge: "WELLNESS TIPS",
      title: "Stay Healthy",
      description: "Get personalized wellness tips to improve your lifestyle, diet, and mental well-being.",
      icon: <Heart className="w-20 h-20 md:w-32 md:h-32 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />,
      color: "#ec4899", // Pink
      gradient: "from-pink-500 to-rose-600"
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

  // Safety check
  if (!slides[currentSlide]) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="AI Assistant Onboarding"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl min-h-[600px] md:h-[600px] bg-[#0B0F17] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10"
          >
            {/* Dynamic Background Glowing Bubbles */}
            <motion.div 
              animate={{ backgroundColor: slides[currentSlide].color }}
              className="absolute top-[-200px] left-[-200px] w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full blur-[120px] md:blur-[180px] opacity-20 transition-colors duration-700 pointer-events-none"
            />
            <motion.div 
              animate={{ backgroundColor: slides[currentSlide].color }}
              className="absolute bottom-[-200px] right-[-200px] w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full blur-[120px] md:blur-[180px] opacity-20 transition-colors duration-700 pointer-events-none"
            />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 z-50 p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all backdrop-blur-sm border border-white/5"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Left Content Section */}
            <div className="flex-1 p-8 md:p-16 flex flex-col justify-between relative z-20 order-2 md:order-1">
              <div>
                {/* Badge */}
                <motion.div
                  key={`badge-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6 md:mb-10"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <Sparkles size={18} className="text-white" />
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
                    className="space-y-4 md:space-y-8"
                  >
                    <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="text-base md:text-lg text-slate-400 leading-relaxed font-light max-w-md">
                      {slides[currentSlide].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-10 md:mt-0">
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

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={handleClose}
                    className="text-sm font-medium text-slate-500 hover:text-white transition-colors px-4 py-2"
                  >
                    Skip
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextSlide}
                    className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-bold text-white text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2.5 bg-gradient-to-r ${slides[currentSlide].gradient}`}
                  >
                    <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Right Visual Section */}
            <div className="relative w-full md:w-1/2 h-[300px] md:h-auto flex items-center justify-center overflow-hidden order-1 md:order-2 bg-gradient-to-b from-white/5 to-transparent md:bg-none">
              {/* Premium Glass Card */}
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: "spring", duration: 1, bounce: 0.3 }}
                className="relative w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-[40px] md:rounded-[60px] backdrop-blur-[40px] flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
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
                  className="absolute inset-0 rounded-[40px] md:rounded-[60px]"
                  style={{
                    boxShadow: `inset 0 0 30px ${slides[currentSlide].color}30`
                  }}
                />

                {/* Inner Content Container */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[30px] md:rounded-[40px] flex items-center justify-center">
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

export default AIChatOnboarding;
