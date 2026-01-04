import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Scan, CheckCircle, Smartphone, Zap } from 'lucide-react';
import IdentityCard from './IdentityCard';
import confetti from 'canvas-confetti';

const IdentityReveal = ({ user, onComplete }) => {
  const [stage, setStage] = useState('initializing'); // initializing, processing, minting, revealed
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Sequence Logic
    const startSequence = async () => {
      // Stage 1: Initializing
      await new Promise(r => setTimeout(r, 1000));
      setStage('processing');
      
      // Stage 2: Processing (Fake Loading)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      await new Promise(r => setTimeout(r, 3000));
      setStage('minting');
      
      await new Promise(r => setTimeout(r, 2000));
      setStage('revealed');
      
      // Confetti Effect
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#ffffff']
      });
    };

    startSequence();
  }, []);

  const handleSkip = () => {
    setStage('revealed');
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] overflow-y-auto overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <AnimatePresence mode='wait'>
            {/* STAGE 1 & 2: LOADING / PROCESSING */}
            {(stage === 'initializing' || stage === 'processing') && (
            <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                className="flex flex-col items-center justify-center relative z-10 w-full max-w-md text-center"
            >
                <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mb-6 md:mb-8 relative"
                >
                    <div className="absolute inset-0 rounded-full border-4 border-white/5 blur-sm" />
                    <Scan className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight px-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    ANALYZING HEALTH PROFILE
                </span>
                </h2>
                
                <p className="text-slate-400 font-mono text-xs md:text-sm mb-8 h-6 relative overflow-hidden">
                    <AnimatePresence mode='wait'>
                        <motion.span 
                            key={progress > 30 ? (progress > 70 ? 'C' : 'B') : 'A'}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="block"
                        >
                            {progress < 30 && "Encrypting biometric data..."}
                            {progress >= 30 && progress < 70 && "Generating unique secure hash..."}
                            {progress >= 70 && "Preparing digital health passport..."}
                        </motion.span>
                    </AnimatePresence>
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden relative border border-white/10">
                <motion.div 
                    className="h-full bg-emerald-500 relative"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </motion.div>
                </div>
                
                <div className="mt-4 flex justify-between w-full max-w-xs text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-widest">
                    <span>System: Secure</span>
                    <span>{Math.round(progress)}% Complete</span>
                </div>
                
                <button onClick={handleSkip} className="mt-8 md:mt-12 text-slate-600 hover:text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold transition-colors p-4">
                    Skip Sequence
                </button>
            </motion.div>
            )}

            {/* STAGE 3: MINTING (Transition) */}
            {stage === 'minting' && (
            <motion.div
                key="minting"
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.5, 20], opacity: [1, 0.5, 0] }}
                        transition={{ duration: 1.5, ease: "easeIn" }}
                        className="w-32 h-32 bg-emerald-500 rounded-full blur-xl"
                    />
                </div>
            </motion.div>
            )}

            {/* STAGE 4: REVEALED */}
            {stage === 'revealed' && (
            <motion.div
                key="revealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 w-full max-w-5xl flex flex-col items-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-center mb-6 md:mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">
                        <CheckCircle className="w-3 h-3" />
                        Identity Generated Successfully
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black text-white mb-4 leading-tight">
                        Your <span className="text-emerald-500">MediTrack</span> Identity
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-lg leading-relaxed px-4">
                        This unique digital card is your passport to the MediTrack ecosystem. Share it securely with family and doctors.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 20,
                        delay: 0.2 
                    }}
                    className="relative my-4 md:my-8 perspective-1000 w-full flex justify-center"
                >
                    <div className="relative group">
                        <div className="absolute -inset-10 bg-emerald-500/20 blur-[60px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-500 pointer-events-none" />
                        <IdentityCard user={user} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="flex flex-col items-center gap-4 w-full mt-4 md:mt-8 pb-8"
                >
                    <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800 text-slate-300">
                        <Smartphone className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs md:text-sm font-medium">Accessible anytime in Settings</span>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="w-full max-w-sm px-8 py-4 bg-white text-slate-900 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Enter Dashboard
                    </button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IdentityReveal;
