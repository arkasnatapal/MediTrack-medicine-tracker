import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Clock, Calendar, Trash2, Edit, Plus, Pill, User, X, 
  Check, ChevronRight, Sparkles, Search, RefreshCw, AlertCircle 
} from "lucide-react";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";

const Reminders = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/reminders");
      if (response.data.success) {
        setReminders(response.data.reminders || []);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      notify.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/reminders/${deleteId}`);
      setReminders((prev) => prev.filter((r) => r._id !== deleteId));
      notify.success("Reminder deleted successfully");
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting reminder:", error);
      const msg = error.response?.data?.message || "Failed to delete reminder";
      notify.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showMedicineList, setShowMedicineList] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [myMedicines, setMyMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [editingReminder, setEditingReminder] = useState(null);

  const [formData, setFormData] = useState({
    times: ["09:00"],
    daysOfWeek: [],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/medicines");
      if (response.data.success) {
        setMyMedicines(response.data.medicines || []);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      notify.error("Failed to load medicines");
    }
  };

  const handleAddClick = () => {
    setShowTypeModal(true);
  };

  const handleTypeSelect = (type) => {
    setShowTypeModal(false);
    if (type === "new") {
      navigate("/add-medicine");
    } else {
      fetchMedicines();
      setShowMedicineList(true);
    }
  };

  const handleMedicineSelect = (med) => {
    setSelectedMedicine(med);
    setShowMedicineList(false);
    setEditingReminder(null);
    setFormData({
      times: ["09:00"],
      daysOfWeek: [],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setShowReminderForm(true);
  };

  const handleEditClick = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      times: reminder.times || ["09:00"],
      daysOfWeek: reminder.daysOfWeek || [],
      startDate: reminder.startDate ? new Date(reminder.startDate).toISOString().split("T")[0] : "",
      endDate: reminder.endDate ? new Date(reminder.endDate).toISOString().split("T")[0] : "",
    });
    setShowReminderForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const payload = {
        ...formData,
        medicineId: selectedMedicine?._id,
        targetUserId: selectedMedicine?.userId || editingReminder?.targetUser?._id,
        channels: { inApp: true, email: true },
      };

      if (editingReminder) {
        const response = await api.put(`/reminders/${editingReminder._id}`, payload);
        if (response.data.success) {
          notify.success("Reminder updated successfully");
          setReminders(prev => prev.map(r => r._id === editingReminder._id ? response.data.reminder : r));
        }
      } else {
        const response = await api.post("/reminders", payload);
        if (response.data.success) {
          notify.success("Reminder set successfully");
          setReminders(prev => [...prev, response.data.reminder]);
        }
      }
      setShowReminderForm(false);
      fetchReminders();
    } catch (error) {
      console.error("Error saving reminder:", error);
      notify.error("Failed to save reminder");
    } finally {
      setSubmitLoading(false);
    }
  };

  const addTime = () => {
    setFormData({ ...formData, times: [...formData.times, "09:00"] });
  };

  const removeTime = (index) => {
    setFormData({ ...formData, times: formData.times.filter((_, i) => i !== index) });
  };

  const updateTime = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const toggleDay = (day) => {
    const days = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter(d => d !== day)
      : [...formData.daysOfWeek, day];
    setFormData({ ...formData, daysOfWeek: days });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSyncCalendar = async (reminder) => {
    try {
      const response = await api.put(`/reminders/${reminder._id}`, { ...reminder });
      if (response.data.success) {
        notify.success("Synced to Google Calendar");
        fetchReminders();
      }
    } catch (error) {
      console.error("Sync error:", error);
      notify.error("Failed to sync");
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading reminders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Creative Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium mb-3"
              >
                <Bell className="w-3 h-3" />
                <span>Smart Notifications</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                Medication Reminders
              </h1>
              <p className="text-teal-50 text-lg max-w-xl leading-relaxed">
                Stay on top of your health with intelligent scheduling and multi-channel alerts.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              className="group relative px-8 py-4 bg-white text-teal-700 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10 dark:text-black">Add Reminder</span>
            </motion.button>
          </div>
        </div>

        {/* Reminders Count */}
        {reminders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-2"
          >
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {reminders.length} active {reminders.length === 1 ? 'reminder' : 'reminders'}
            </p>
          </motion.div>
        )}

        {/* Reminders Grid */}
        {reminders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                <Bell className="w-10 h-10 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No reminders set</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
                Add a medicine with reminders enabled to get started with your health routine.
              </p>
              <button
                onClick={handleAddClick}
                className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Medicine
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {reminders.map((reminder, index) => (
              <motion.div
                key={reminder._id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group relative bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-slate-700 overflow-hidden"
              >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-bl-[4rem] transition-all group-hover:scale-110" />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Pill className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {reminder.medicineName}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {reminder.medicine?.dosage || "No dosage"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => handleEditClick(reminder)}
                        className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(reminder._id)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-4 mb-6">
                    {/* Times */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reminder.times.map((time, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl shadow-sm"
                          >
                            {formatTime(time)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Days */}
                    {reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {reminder.daysOfWeek.map((day, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(reminder.startDate)}</span>
                        {reminder.endDate && <span>→ {formatDate(reminder.endDate)}</span>}
                      </div>
                      
                      <div className="flex gap-1.5">
                        {reminder.channels?.inApp && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="In-App" />
                        )}
                        {reminder.channels?.email && (
                          <div className="w-2 h-2 rounded-full bg-purple-500" title="Email" />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => user?.google?.calendarConnected ? handleSyncCalendar(reminder) : navigate('/settings')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        reminder.googleEventId 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {reminder.googleEventId ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Synced to Calendar
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" /> Sync to Google Calendar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Type Selection Modal */}
      <AnimatePresence>
        {showTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Reminder</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how to start</p>
                </div>
                <button onClick={() => setShowTypeModal(false)} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleTypeSelect("new")}
                  className="w-full p-6 border-2 border-gray-100 dark:border-slate-700 rounded-3xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">New Medicine</h3>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Register & set reminder</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </button>

                <button
                  onClick={() => handleTypeSelect("existing")}
                  className="w-full p-6 border-2 border-gray-100 dark:border-slate-700 rounded-3xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">Existing Medicine</h3>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">From your inventory</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Medicine Selection Modal */}
      <AnimatePresence>
        {showMedicineList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMedicineList(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] max-w-4xl w-full p-8 shadow-2xl border border-white/10 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Medicine</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose from your inventory</p>
                </div>
                <button onClick={() => setShowMedicineList(false)} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6 relative group">
                <div className="absolute inset-0 bg-teal-500/5 rounded-2xl blur-md group-focus-within:bg-teal-500/10 transition-colors" />
                <div className="relative bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-transparent flex items-center px-4 py-3 transition-all group-focus-within:border-teal-500/20 group-focus-within:bg-white dark:group-focus-within:bg-slate-900">
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full ml-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {myMedicines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                      <Pill className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No medicines found.</p>
                    <button 
                      onClick={() => navigate("/add-medicine")}
                      className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Add New Medicine
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myMedicines
                      .filter(med => 
                        med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (med.genericName && med.genericName.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((med) => (
                      <button
                        key={med._id}
                        onClick={() => handleMedicineSelect(med)}
                        className="text-left group relative p-5 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent hover:border-emerald-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          {new Date(med.expiryDate) < new Date() && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {med.name}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                          {med.genericName || med.form || "Medicine"}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-400 pt-3 border-t border-gray-200 dark:border-slate-700/50">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {med.dosage || "N/A"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reminder Form Modal */}
      <AnimatePresence>
        {showReminderForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReminderForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingReminder ? "Edit Reminder" : "Set Reminder"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your schedule</p>
                </div>
                <button onClick={() => setShowReminderForm(false)} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-8">
                {!editingReminder && selectedMedicine && (
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                      <Pill className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Selected Medicine</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedMedicine.name}</p>
                    </div>
                  </div>
                )}

                {/* Times */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      Reminder Times
                    </label>
                    <button
                      type="button"
                      onClick={addTime}
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Time
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.times.map((time, idx) => (
                      <div key={idx} className="flex gap-2">
                        <div className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus-within:border-teal-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => updateTime(idx, e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white font-bold text-lg"
                            style={{ colorScheme: 'dark' }}
                            required
                          />
                        </div>
                        {formData.times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTime(idx)}
                            className="px-5 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1 mb-3 block">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                      const active = formData.daysOfWeek.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`w-12 h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                            active
                              ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105"
                              : "bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {day.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1">Select days or leave empty for daily reminders</p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      End Date (Opt)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-slate-700/50 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowReminderForm(false)}
                    className="px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitLoading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white/30 dark:border-gray-900/30 border-t-current rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      editingReminder ? "Update Reminder" : "Set Reminder"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Reminders;
