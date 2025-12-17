import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, XCircle, Clock, Sparkles, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import ReminderActionModal from "./ReminderActionModal";

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
    return null;
  }

  if (pendingReminders.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
      >
        {/* Gradient Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center gap-4 mb-6">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 10, 0],
              // scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="flex-shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-60" />
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Pending Reminders
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {pendingReminders.length} reminder{pendingReminders.length !== 1 ? "s" : ""} waiting for action
            </p>
          </div>

          {/* Badge */}
          <div className="flex-shrink-0">
            <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg">
              <span className="text-white font-bold text-sm">{pendingReminders.length}</span>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        <div className={`relative space-y-3 ${pendingReminders.length > 1 ? 'max-h-96 overflow-y-auto' : ''} overflow-x-hidden custom-scrollbar pr-2`}>
          <AnimatePresence>
            {pendingReminders.map((reminder, index) => (
              <motion.div
                key={reminder._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                // whileHover={{ scale: 1.02 }}
                className="relative bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
              >
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center">
                      <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                        {reminder.medicineName}
                      </h4>
                      {reminder.medicine?.dosage && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                          Dosage: {reminder.medicine.dosage}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(reminder.scheduledTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="relative flex gap-2">
                  <motion.button

                    onClick={() => handleDismiss(reminder._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-xs font-bold shadow-md"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Dismiss
                  </motion.button>
                  
                  <motion.button
                    // whileTap={{ scale: 0.98 }}
                    onClick={() => handleConfirm(reminder)}
                    className="relative flex-1 overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-1.5 px-3 py-2 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 group-hover/btn:shadow-emerald-500/50 transition-all">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Confirm
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
