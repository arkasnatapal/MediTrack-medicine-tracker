import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Pattern - Static CSS is much lighter than animated divs */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
      />
      
      {/* Simple Gradient Blob - Fixed position, no animation loop */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Main Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl"
        >
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>

          {/* 404 Text */}
          <h1 className="text-6xl md:text-8xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            404
          </h1>
          
          <h2 className="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
        
        {/* Footer */}
        <p className="mt-8 text-sm text-slate-400 dark:text-slate-600">
          MediTrack Health System
        </p>
      </div>
    </div>
  );
};

export default NotFound;
