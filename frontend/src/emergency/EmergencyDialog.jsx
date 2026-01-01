import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmergencyDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const [problem, setProblem] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (problem.trim()) {
            onSubmit(problem);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!loading ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed z-50 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <AlertCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Describe Emergency</h2>
                                    <p className="text-red-100 text-xs">AI will recommend the best hospital</p>
                                </div>
                            </div>
                            {!loading && (
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        What is happening?
                                    </label>
                                    <textarea
                                        value={problem}
                                        onChange={(e) => setProblem(e.target.value)}
                                        placeholder="e.g. I have severe chest pain and shortage of breath..."
                                        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!problem.trim() || loading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                                        ${!problem.trim() || loading
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/25 transform hover:-translate-y-1 active:scale-95'
                                        }
                                    `}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Find Best Hospital
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EmergencyDialog;
