import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, XCircle, Clock, Sparkles, Pill, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import ReminderActionModal from "./ReminderActionModal";
import { Link } from 'react-router-dom';

const PendingRemindersWidget = () => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'upcoming'
  const [pendingReminders, setPendingReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [hasNewPending, setHasNewPending] = useState(false);
  const prevPendingCount = useRef(0);

  const fetchPendingReminders = async () => {
    try {
      const response = await api.get("/pending-reminders");
      if (response.data.success) {
        const newReminders = response.data.pendingReminders || [];
        setPendingReminders(newReminders);
        
        // Check for new pending reminders to show badge
        if (newReminders.length > prevPendingCount.current && activeTab === 'upcoming') {
            setHasNewPending(true);
        }
        prevPendingCount.current = newReminders.length;
      }
    } catch (error) {
      console.error("Error fetching pending reminders:", error);
    }
  };

  const fetchUpcomingReminders = async () => {
      try {
          const response = await api.get("/reminders");
          if (response.data.success) {
              const allReminders = response.data.reminders || [];
              processUpcomingReminders(allReminders);
          }
      } catch (error) {
          console.error("Error fetching upcoming reminders:", error);
      }
  };

  const processUpcomingReminders = (reminders) => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = days[now.getDay()];

      const upcoming = [];

      reminders.forEach(reminder => {
          // Check if reminder is active and for today
          if (!reminder.active) return;
          if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && !reminder.daysOfWeek.includes(currentDay)) {
              return;
          }

          reminder.times.forEach(timeStr => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              const reminderTime = new Date(now);
              reminderTime.setHours(hours, minutes, 0, 0);

              // Show all future reminders for today
              if (reminderTime > now && reminderTime <= endOfDay) {
                  upcoming.push({
                      ...reminder,
                      scheduledTime: reminderTime, // Add calculated time for display
                      _id: `${reminder._id}-${timeStr}` // Unique key for list
                  });
              }
          });
      });

      // Sort by time
      upcoming.sort((a, b) => a.scheduledTime - b.scheduledTime);
      setUpcomingReminders(upcoming);
  };

  const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchPendingReminders(), fetchUpcomingReminders()]);
      setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
        fetchPendingReminders();
        fetchUpcomingReminders(); 
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear badge when switching to pending tab
  useEffect(() => {
      if (activeTab === 'pending') {
          setHasNewPending(false);
      }
  }, [activeTab]);

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
      <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 h-[320px] flex items-center justify-center overflow-hidden group">
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
      className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden min-h-[320px] h-full flex flex-col group"
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[60px] group-hover:bg-teal-500/20 transition-colors duration-700" />
      </div>

      {/* Header & Tabs */}
      <div className="relative flex flex-col gap-4 mb-6 z-10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg text-white">
                <Bell className="h-6 w-6" />
                </div>
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Reminders
                </h3>
                <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                {activeTab === 'pending' 
                    ? (pendingReminders.length > 0 ? `${pendingReminders.length} Pending` : "All Clear")
                    : (upcomingReminders.length > 0 ? `${upcomingReminders.length} Upcoming` : "No Upcoming")
                }
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

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl relative">
            <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 relative ${
                    activeTab === 'pending' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                Pending
                {hasNewPending && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                )}
            </button>
            <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                    activeTab === 'upcoming' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
                Upcoming
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 flex items-center overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
        <div className={`flex gap-4 w-full ${(activeTab === 'pending' ? pendingReminders : upcomingReminders).length === 0 ? 'justify-center' : ''}`}>
            
            {/* Pending Reminders View */}
            {activeTab === 'pending' && (
                pendingReminders.length === 0 ? (
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
                        if (count === 1) widthClass = "w-full";
                        else if (count === 2) widthClass = "w-[calc(50%-0.5rem)]";
                        else widthClass = "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)]";

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
                )
            )}

            {/* Upcoming Reminders View */}
            {activeTab === 'upcoming' && (
                upcomingReminders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
                            <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nothing Coming Up</h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No more reminders today.</p>
                    </div>
                ) : (
                    <AnimatePresence mode='popLayout'>
                    {upcomingReminders.map((reminder, index) => {
                         // Dynamic width logic (same as pending)
                         const count = upcomingReminders.length;
                         let widthClass = "";
                         if (count === 1) widthClass = "w-full";
                         else if (count === 2) widthClass = "w-[calc(50%-0.5rem)]";
                         else widthClass = "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)]";

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
                        <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 group/card hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col h-full justify-between">
                            
                            {/* Icon & Time */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <Clock className="h-3 w-3" />
                                    {reminder.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                            {/* Status Badge */}
                            <div className="mt-auto">
                                <div className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold text-center">
                                    Coming Soon
                                </div>
                            </div>
                        </div>
                        </motion.div>
                        );
                    })}
                    </AnimatePresence>
                )
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
