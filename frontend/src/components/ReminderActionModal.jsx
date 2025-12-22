import React, { useState } from "react";
import { X, Pill, CheckCircle, XCircle, Sparkles, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import RefillStockModal from "./RefillStockModal";

const ReminderActionModal = ({ pendingReminder, onClose, onConfirm }) => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [medicineData, setMedicineData] = useState(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/pending-reminders/${pendingReminder._id}/confirm`);
      
      if (response.data.success) {
        const { message, stockLeft, medicine } = response.data;
        
        // Show success toast
        notify.success(`${message}. Stock left: ${stockLeft}`);
        
        // If stock is 0, show refill modal
        if (stockLeft === 0) {
          setMedicineData(medicine);
          setShowRefillModal(true);
        } else {
          // Close modal and refresh page
          onConfirm?.();
          onClose();
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (error) {
      console.error("Error confirming reminder:", error);
      notify.error("Failed to confirm medicine intake");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setLoading(true);
      await api.post(`/pending-reminders/${pendingReminder._id}/dismiss`);
      notify.info("Reminder dismissed");
      onClose();
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      notify.error("Failed to dismiss reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleRefillComplete = () => {
    setShowRefillModal(false);
    onConfirm?.();
    onClose();
    setTimeout(() => window.location.reload(), 500);
  };

  if (showRefillModal && medicineData) {
    return (
      <RefillStockModal
        medicine={medicineData}
        onClose={() => {
          setShowRefillModal(false);
          onConfirm?.();
          onClose();
        }}
        onRefillComplete={handleRefillComplete}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
        >
          {/* Gradient Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="relative mb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-60 animate-pulse" />
                <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <Pill className="h-8 w-8 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-2"
            >
              Medicine Reminder
              <Sparkles className="h-5 w-5 text-emerald-500" />
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400"
            >
              <Clock className="h-4 w-4" />
              {new Date(pendingReminder.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
            </motion.div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative mb-8 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <p className="text-center text-base text-slate-600 dark:text-slate-400 mb-3">
              Have you taken your medicine?
            </p>
            <p className="text-center text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {pendingReminder.medicineName}
            </p>
            {pendingReminder.medicine?.dosage && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">
                Dosage: {pendingReminder.medicine.dosage}
              </p>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative grid grid-cols-2 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg"
            >
              <XCircle className="h-5 w-5" />
              Not Yet
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={loading}
              className="relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2 px-6 py-4 text-white font-bold shadow-lg shadow-emerald-600/30 group-hover:shadow-emerald-500/50 transition-all">
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Yes, Taken
                  </>
                )}
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReminderActionModal;
