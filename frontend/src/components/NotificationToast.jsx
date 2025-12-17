import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500'
};

const NotificationToast = ({ id, type = 'info', message, duration, onClose }) => {
  const Icon = icons[type] || icons.info;
  const colorClass = colors[type] || colors.info;

  useEffect(() => {
    if (!duration) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      layout
      className="pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl shadow-lg backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 flex items-start gap-3"
    >
      <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default NotificationToast;
