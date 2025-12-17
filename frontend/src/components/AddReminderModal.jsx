import React, { useState } from "react";
import { X, Clock, Calendar, Save, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";

const AddReminderModal = ({ medicineId, medicineName, onClose, onSave }) => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [times, setTimes] = useState(["09:00"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("daily"); // currently only daily supported in UI for simplicity

  const addTime = () => {
    setTimes([...times, "12:00"]);
  };

  const removeTime = (index) => {
    const newTimes = times.filter((_, i) => i !== index);
    setTimes(newTimes);
  };

  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (times.length === 0) {
      notify.error("Please add at least one time");
      return;
    }

    try {
      setLoading(true);
      // Construct the reminder object
      // Note: The backend expects an array of reminders or a single reminder creation.
      // Based on typical REST patterns, we'll POST to /reminders
      const payload = {
        medicineId,
        type: "medication",
        frequency,
        times,
        startDate,
        endDate: endDate || null,
      };

      const res = await api.post("/reminders", payload);
      if (res.data.success) {
        notify.success("Reminder added successfully");
        onSave?.();
        onClose();
      }
    } catch (error) {
      console.error("Error adding reminder:", error);
      notify.error(error.response?.data?.message || "Failed to add reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Reminder</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">for {medicineName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="reminder-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Frequency */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Times */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Times</label>
                  <button
                    type="button"
                    onClick={addTime}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Time
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {times.map((time, index) => (
                    <div key={index} className="relative group">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center font-mono"
                      />
                      {times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
            <button
              type="submit"
              form="reminder-form"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Reminder
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddReminderModal;
