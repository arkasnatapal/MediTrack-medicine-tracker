import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X, Check, Trash } from 'lucide-react';
import { useMedicine } from '../context/MedicineContext';

const ExpiredCleanupModal = ({ forceOpen, onClose }) => {
    const { medicines, bulkDeleteMedicines } = useMedicine();
    const [expiredMeds, setExpiredMeds] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true);
        }
    }, [forceOpen]);
    useEffect(() => {
        const now = new Date();
        const expired = (medicines || []).filter(med => new Date(med.expiryDate) < now);
        setExpiredMeds(expired);
        
        // Show modal if expired meds found and user hasn't dismissed it in this session
        if (expired.length > 0 && !sessionStorage.getItem('expired_cleanup_dismissed')) {
            setIsOpen(true);
            setSelectedIds(expired.map(m => m._id)); // Default select all
        }
    }, [medicines]);

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === expiredMeds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(expiredMeds.map(m => m._id));
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        setDeleting(true);
        const success = await bulkDeleteMedicines(selectedIds);
        if (success) {
            setIsOpen(false);
            if (onClose) onClose();
        }
        setDeleting(false);
    };

    const handleDismiss = () => {
        setIsOpen(false);
        if (onClose) onClose();
        sessionStorage.setItem('expired_cleanup_dismissed', 'true');
    };

    if (!isOpen || expiredMeds.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={handleDismiss}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-rose-500" />
                        </div>
                        <button onClick={handleDismiss} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Expired Medicines Detected</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                        The following medicines in your database have expired. Would you like to remove them to keep your inventory accurate?
                    </p>

                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 mb-8 custom-scrollbar">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <button 
                                onClick={handleSelectAll}
                                className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
                            >
                                {selectedIds.length === expiredMeds.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {selectedIds.length} Selected
                            </span>
                        </div>

                        {expiredMeds.map(med => (
                            <div 
                                key={med._id}
                                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                    selectedIds.includes(med._id)
                                        ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                                onClick={() => handleToggleSelect(med._id)}
                            >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedIds.includes(med._id) ? 'bg-rose-500 border-rose-500' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                    {selectedIds.includes(med._id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{med.name}</p>
                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                                        Expired on: {new Date(med.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleDismiss}
                            className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Decide Later
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={selectedIds.length === 0 || deleting}
                            className="flex-[2] py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {deleting ? 'Cleaning up...' : (
                                <>
                                    <Trash className="w-4 h-4" />
                                    Delete {selectedIds.length > 0 ? selectedIds.length : ''} Medicines
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ExpiredCleanupModal;
