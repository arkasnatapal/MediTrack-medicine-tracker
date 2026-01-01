import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';
import api from '../api/api';

const MedicalHistoryModal = ({ isOpen, onSuccess, onClose }) => {
  const [history, setHistory] = useState([]);
  const [other, setOther] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const conditions = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Thyroid Disorders",
    "Kidney Disease",
    "Asthma",
    "Cancer"
  ];

  const toggleCondition = (condition) => {
    setHistory(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Combine checkboxes and other input
      const finalHistory = [...history];
      if (other.trim()) {
        const others = other.split(',').map(s => s.trim()).filter(Boolean);
        finalHistory.push(...others);
      }

      const res = await api.put('/auth/update-profile', {
        familyMedicalHistory: finalHistory
      });

      if (res.data.success) {
        onSuccess(res.data.user);
      }
    } catch (err) {
      console.error("Medical History Error:", err);
      setError(err.response?.data?.message || 'Failed to save history. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
     // Treat skip as success but with empty/existing data
     onSuccess();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0B0F17] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
        >
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 blur-[60px] rounded-full"></div>
            
            <div className="relative z-10 flex flex-col items-center text-white">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-2 shadow-lg border border-white/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Family Medical History</h2>
            </div>
          </div>

          <div className="p-8">
             <div className="flex gap-3 mb-6 bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-blue-600 dark:text-blue-400 mb-0.5">Why ask this?</p>
                  This helps our AI provide safer, more personalized health insights. It is never used for diagnosis.
                </div>
             </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-3">
                {conditions.map((condition) => (
                  <label key={condition} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${history.includes(condition) ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                    <div className="relative flex items-center">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${history.includes(condition) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400 bg-white dark:bg-black/20'}`}>
                         {history.includes(condition) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={history.includes(condition)}
                        onChange={() => toggleCondition(condition)}
                      />
                    </div>
                    <span className={`text-sm font-medium ${history.includes(condition) ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {condition}
                    </span>
                  </label>
                ))}
              </div>

               {/* Other */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                  Other Conditions
                </label>
                <input
                  type="text"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  placeholder="e.g. Migraine, Arthritis (comma separated)"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-all"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Finish Setup
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MedicalHistoryModal;
