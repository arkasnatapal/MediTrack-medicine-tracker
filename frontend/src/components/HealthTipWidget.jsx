import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

const tips = [
  "Drink at least 8 glasses of water today to stay hydrated.",
  "Take a 5-minute break every hour to stretch and rest your eyes.",
  "Regular exercise can boost your immune system and improve mood.",
  "Ensure you get 7-8 hours of quality sleep for better health.",
  "Eat a balanced diet rich in fruits, vegetables, and whole grains.",
  "Wash your hands frequently to prevent the spread of germs.",
  "Practice deep breathing exercises to reduce stress levels.",
  "Limit your sugar intake to maintain healthy blood sugar levels.",
  "Don't forget to take your vitamins if prescribed by your doctor.",
  "Schedule regular check-ups with your healthcare provider."
];

const HealthTipWidget = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [tip, setTip] = useState('');

  useEffect(() => {
    // Select a random tip on mount
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 p-4 md:p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-1">
                Daily Health Tip
              </h3>
              <p className="text-amber-900 dark:text-amber-100 font-medium text-sm md:text-base leading-relaxed">
                {tip}
              </p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HealthTipWidget;
