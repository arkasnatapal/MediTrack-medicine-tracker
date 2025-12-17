import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Clock, Calendar, Trash2, Edit, Plus, Pill, User, X, Check, ChevronRight, Sparkles, Search, RefreshCw } from "lucide-react";
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
      await api.delete(`/reminders/${deleteId}`);
      setReminders((prev) => prev.filter((r) => r._id !== deleteId));
      notify.success("Reminder deleted successfully");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      const msg = error.response?.data?.message || "Failed to delete reminder";
      notify.error(msg);
    }
    finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
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
      <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
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
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10 h-screen overflow-y-auto scrollbar-hide">
        <motion.div 
          className="max-w-7xl mx-auto space-y-8 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3">
                <Bell className="h-8 w-8 text-emerald-500" />
                Medication Reminders
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                Manage your medication reminder schedule
              </p>
            </div>
            <button
              onClick={handleAddClick}
              className="group relative px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <Plus className="h-5 w-5" />
              <span>Add Reminder</span>
            </button>
          </motion.div>

          {/* Reminders Count */}
          {reminders.length > 0 && (
            <motion.div variants={itemVariants} className="flex items-center gap-2 px-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {reminders.length} active {reminders.length === 1 ? 'reminder' : 'reminders'}
              </p>
            </motion.div>
          )}

          {/* Reminders Grid */}
          {reminders.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="text-center py-16 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700"
            >
              <Bell className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No reminders set
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Add a medicine with reminders enabled to get started
              </p>
              <button
                onClick={handleAddClick}
                className="px-6 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Medicine
              </button>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {reminders.map((reminder, index) => (
                <motion.div
                  key={reminder._id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative"
                >
                  {/* Glowing Border Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                  
                  {/* Card Container */}
                  <div className="relative h-full p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                      <Bell className="w-full h-full transform rotate-12" />
                    </div>

                    {/* Header */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                          <Pill className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {reminder.medicineName}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                            {reminder.medicine?.dosage || "No dosage info"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(reminder)}
                          className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all duration-200 hover:scale-110"
                          title="Edit reminder"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(reminder._id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-110"
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="relative z-10 space-y-3 mb-4">
                      {/* Times */}
                      <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reminder Times</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reminder.times.map((time, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-lg"
                            >
                              {formatTime(time)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Days of week */}
                      {reminder.daysOfWeek && reminder.daysOfWeek.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Days</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {reminder.daysOfWeek.map((day, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Target user */}
                      <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-500" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">For</p>
                            <p className="text-sm text-slate-900 dark:text-white font-semibold">
                              {reminder.targetUser?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(reminder.startDate)}
                        </span>
                        {reminder.endDate && (
                          <span className="flex items-center gap-1">
                            → {formatDate(reminder.endDate)}
                          </span>
                        )}
                      </div>

                      {/* Channels */}
                      <div className="flex gap-2">
                        {reminder.channels?.inApp && (
                          <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg">
                            In-App
                          </span>
                        )}
                        {reminder.channels?.email && (
                          <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-lg">
                            Email
                          </span>
                        )}
                        {reminder.googleEventId && (
                          <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Synced
                          </span>
                        )}
                      </div>

                      {/* Google Calendar Sync Button */}
                      <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                         {user?.google?.calendarConnected ? (
                            <button
                              onClick={() => handleSyncCalendar(reminder)}
                              className="text-xs flex items-center gap-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                              title="Force sync to Google Calendar"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Sync to Calendar
                            </button>
                         ) : (
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="Connect Google Calendar in Settings"
                            >
                              <Calendar className="h-3 w-3" />
                              Connect Calendar
                            </button>
                         )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Type Selection Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Reminder</h2>
              <button onClick={() => setShowTypeModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => handleTypeSelect("new")}
                className="w-full p-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900 dark:text-white">Add New Medicine</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Register a new medicine and set reminders</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => handleTypeSelect("existing")}
                className="w-full p-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900 dark:text-white">Select Existing Medicine</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Set reminder for a medicine you already added</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Medicine Selection Modal */}
      {showMedicineList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-white/20 dark:border-slate-800 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Medicine</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose a medicine from your inventory</p>
              </div>
              <button onClick={() => setShowMedicineList(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              {myMedicines.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No medicines found.</p>
                  <button 
                    onClick={() => navigate("/add-medicine")}
                    className="mt-4 px-6 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors"
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
                      className="text-left group relative p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                          <Pill className="h-5 w-5" />
                        </div>
                        {new Date(med.expiryDate) < new Date() && (
                          <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium">
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                        {med.genericName || med.form || "Medicine"}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {med.dosage || "No dosage"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(med.expiryDate).toLocaleDateString()}
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

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-white/20 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingReminder ? "Edit Reminder" : "Set Reminder"}
              </h2>
              <button onClick={() => setShowReminderForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {!editingReminder && selectedMedicine && (
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Selected Medicine</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{selectedMedicine.name}</p>
                  </div>
                </div>
              )}

              {/* Times */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Reminder Times
                </label>
                <div className="space-y-3">
                  {formData.times.map((time, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        required
                      />
                      {formData.times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(idx)}
                          className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTime}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add another time
                  </button>
                </div>
              </div>

              {/* Days */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        formData.daysOfWeek.includes(day)
                          ? "bg-emerald-600 text-white shadow-lg scale-105"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Leave empty for every day</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReminderForm(false)}
                  className="px-6 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all"
                >
                  {editingReminder ? "Update Reminder" : "Set Reminder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}


      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Reminders;
