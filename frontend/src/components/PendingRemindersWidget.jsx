import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, Sparkles, Pill, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import ReminderActionModal from "./ReminderActionModal";
import { Link } from 'react-router-dom';

const PendingRemindersWidget = () => {
  const { notify } = useNotification();
  const [pendingReminders, setPendingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState(null);

  const fetchPendingReminders = async () => {
    try {
      const response = await api.get("/pending-reminders");
      if (response.data.success) {
        setPendingReminders(response.data.pendingReminders || []);
      }
    } catch (error) {
      console.error("Error fetching pending reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReminders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingReminders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = (reminder) => {
    setSelectedReminder(reminder);
  };

  const handleDismiss = async (reminderId) => {
    try {
      await api.post(`/pending-reminders/${reminderId}/dismiss`);
      notify.info("Reminder dismissed");
      fetchPendingReminders();
    } catch (error) {
      console.error("Error dismissing reminder:", error);
      notify.error("Failed to dismiss reminder");
    }
  };

  const handleModalClose = () => {
    setSelectedReminder(null);
    fetchPendingReminders();
  };

  if (loading) {
    return (
      <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 h-[280px] flex items-center justify-center overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 opacity-50" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden min-h-[280px] h-full flex flex-col group"
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[60px] group-hover:bg-teal-500/20 transition-colors duration-700" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg text-white">
              <Bell className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Pending Actions
            </h3>
            <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
              {pendingReminders.length > 0 ? `${pendingReminders.length} Waiting` : "All Clear"}
            </p>
          </div>
        </div>
        
        <Link 
          to="/reminders"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative flex-1 flex items-center overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
        <div className={`flex gap-4 w-full ${pendingReminders.length === 0 ? 'justify-center' : ''}`}>
            {pendingReminders.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">All Caught Up!</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No pending medicines.</p>
                 </div>
            ) : (
                <AnimatePresence mode='popLayout'>
                {pendingReminders.map((reminder, index) => {
                    // Dynamic width logic
                    const count = pendingReminders.length;
                    let widthClass = "";
                    
                    if (count === 1) {
                        widthClass = "w-full";
                    } else if (count === 2) {
                        widthClass = "w-[calc(50%-0.5rem)]";
                    } else {
                        // 3 or more items
                        // Mobile: 2 items visible (50% - gap/2)
                        // Desktop: 3 items visible (33.33% - 2*gap/3)
                        // gap is 1rem (16px)
                        // 2 items: (100% - 1rem)/2 = 50% - 0.5rem
                        // 3 items: (100% - 2rem)/3 = 33.33% - 0.666rem
                        widthClass = "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)]";
                    }

                    return (
                    <motion.div
                    key={reminder._id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative flex-shrink-0 snap-center ${widthClass}`}
                    >
                    <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 group/card hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col h-full justify-between">
                        
                        {/* Icon & Time */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <Pill className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <Clock className="h-3 w-3" />
                                {new Date(reminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mb-4">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-0.5" title={reminder.medicineName}>
                                {reminder.medicineName}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                                {reminder.medicine?.dosage || "Take as prescribed"}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto">
                            <button 
                                onClick={() => handleDismiss(reminder._id)}
                                className="flex-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-colors flex items-center justify-center"
                            >
                                <XCircle className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => handleConfirm(reminder)}
                                className="flex-1 p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center justify-center"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    </motion.div>
                    );
                })}
                </AnimatePresence>
            )}
        </div>
      </div>
    </motion.div>

      {selectedReminder && (
        <ReminderActionModal
          pendingReminder={selectedReminder}
          onClose={handleModalClose}
          onConfirm={handleModalClose}
        />
      )}
    </>
  );
};

export default PendingRemindersWidget;
