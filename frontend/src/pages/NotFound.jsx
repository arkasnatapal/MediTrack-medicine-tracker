import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, AlertCircle, Pill, Activity } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  // Floating animation for background elements
  const floatingVariant = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariant = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-gray-50 to-gray-50 dark:from-emerald-900/20 dark:via-[#020617] dark:to-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-10 mix-blend-overlay" />
        
        {/* Animated Orbs */}
        <motion.div
          variants={floatingVariant}
          animate="animate"
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[80px]"
        />
        <motion.div
          variants={floatingVariant}
          animate="animate"
          transition={{ delay: 2 }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* 404 Glitch Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <h1 className="text-[150px] md:text-[200px] font-black leading-none  text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 select-none">
            4<span className='p-12'> </span>4
          </h1>
          
          {/* Overlay Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-white" />
              </div>
              
              {/* Orbiting Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                  <Pill className="w-6 h-6 text-emerald-500" />
                </div>
              </motion.div>
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                  <Activity className="w-6 h-6 text-cyan-500" />
                </div>
              </motion.div>
              
            </motion.div>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 px-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Oops! It seems like the page you're looking for has been moved, deleted, or possibly never existed.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-slate-200/50 dark:shadow-none"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>

            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </motion.div>

        {/* Footer Decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-sm text-slate-400 dark:text-slate-500"
        >
          Error Code: 404
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
