import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, Clock } from 'lucide-react';

const ReminderPopup = ({ isOpen, onClose, medicine }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
        >
          <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-amber-200/50 dark:border-amber-800/50 p-5 overflow-hidden">
            {/* Gradient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 origin-left"
            />

            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-60" />
                  <div className="relative p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Expiry Alert
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {medicine?.name}
                  </span>{' '}
                  is expiring soon!
                </p>
                {medicine?.expiryDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    Expires: {new Date(medicine.expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReminderPopup;
