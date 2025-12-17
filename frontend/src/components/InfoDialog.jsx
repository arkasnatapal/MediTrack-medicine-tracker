import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InfoDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'OK',
  variant = 'info' // 'info', 'success', 'error'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getGradient = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20';
      case 'error':
        return 'bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20';
      default:
        return 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getButtonGradient = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Glassmorphic container */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          {/* Header with gradient */}
          <div className={`p-6 ${getGradient()}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${getIconBg()}`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex justify-end bg-gray-50/50 dark:bg-gray-900/50">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl ${getButtonGradient()}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InfoDialog;
