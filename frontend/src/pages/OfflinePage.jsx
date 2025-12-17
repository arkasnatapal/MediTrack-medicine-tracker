import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Activity } from 'lucide-react';

const OfflinePage = ({ onRetry, isChecking }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Animated Rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
        />
        
        <div className="relative bg-white dark:bg-slate-900 p-6 rounded-full shadow-2xl border-4 border-red-100 dark:border-red-900/30">
          <WifiOff className="w-16 h-16 text-red-500 dark:text-red-400" />
        </div>

        {/* Floating Pills */}
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 -right-12 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg transform rotate-12"
        >
          <div className="w-8 h-4 bg-emerald-500 rounded-full opacity-50" />
        </motion.div>
        
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-4 -left-12 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg transform -rotate-12"
        >
          <div className="w-8 h-4 bg-blue-500 rounded-full opacity-50" />
        </motion.div>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
      >
        Connection Lost
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-8"
      >
        <Activity className="w-5 h-5 text-red-500" />
        <p className="text-lg">Vital signs weak. Waiting for signal...</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onRetry}
        disabled={isChecking}
        className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${isChecking ? 'animate-spin' : 'group-hover:rotate-180'} text-white dark:text-slate-900`} />
          <span className='text-white dark:text-slate-900'>{isChecking ? 'Checking...' : 'Retry Connection'}</span>
        </div>
      </motion.button>
    </div>
  );
};

export default OfflinePage;
