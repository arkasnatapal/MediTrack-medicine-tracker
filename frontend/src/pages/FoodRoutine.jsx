import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, Clock, Calendar, Utensils, Check, X, Bot,
  Filter, Sparkles, ChefHat, Search, LayoutGrid, List, AlignLeft
} from "lucide-react";
import Loader from "../components/Loader";

const API_URL = import.meta.env.VITE_API_URL;

const FoodRoutine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [aiAccess, setAiAccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'
  const [filter, setFilter] = useState({ day: "", mealType: "" });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mealType: "breakfast",
    time: "",
    days: [],
    notes: "",
    tags: "",
  });

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"];

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      let url = `${API_URL}/food?`;
      if (filter.day) url += `day=${filter.day}&`;
      if (filter.mealType) url += `mealType=${filter.mealType}`;

      const res = await axios.get(url, config);
      if (res.data.success) {
        // Sort items by time for timeline view
        const sortedItems = res.data.items.sort((a, b) => {
           if (!a.time) return 1;
           if (!b.time) return -1;
           return a.time.localeCompare(b.time);
        });
        setItems(sortedItems);
      }
    } catch (err) {
      console.error("Error fetching food items:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setAiAccess(res.data.user.settings?.allowAIAccessToFoodChart || false);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const toggleAiAccess = async () => {
    try {
      const token = localStorage.getItem("token");
      const newVal = !aiAccess;
      const res = await axios.post(
        `${API_URL}/settings/ai-food-access`,
        { allow: newVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAiAccess(res.data.allow);
      }
    } catch (err) {
      console.error("Error toggling AI access:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDayToggle = (day) => {
    const currentDays = formData.days;
    if (currentDays.includes(day)) {
      setFormData({ ...formData, days: currentDays.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, days: [...currentDays, day] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t),
      };

      if (editingItem) {
        await axios.put(`${API_URL}/food/${editingItem._id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/food`, payload, config);
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: "",
        mealType: "breakfast",
        time: "",
        days: [],
        notes: "",
        tags: "",
      });
      fetchData();
    } catch (err) {
      console.error("Error saving food item:", err);
      alert("Failed to save item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      mealType: item.mealType,
      time: item.time,
      days: item.days,
      notes: item.notes,
      tags: item.tags.join(", "),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/food/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const askAI = (item) => {
    const prefill = item 
      ? `Should I take my medicine with ${item.name}?` 
      : "Should I take [Medicine Name] based on my food chart?";
    
    navigate("/ai-assistant", { 
      state: { 
        includeFood: true, 
        prefill: prefill 
      } 
    });
  };

  const getMealColor = (type) => {
    switch(type) {
      case 'breakfast': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'lunch': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'dinner': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'snack': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getMealIcon = (type) => {
    switch(type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍲';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section - Clean MedicalReports Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 p-10 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium mb-3">
                <Utensils className="w-3 h-3" />
                <span>Nutrition Tracker</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                Food Routine
              </h1>
              <p className="text-teal-50 text-lg max-w-xl">
                Plan your meals and check interactions with your medication.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => askAI(null)}
                className="flex items-center gap-2 px-6 py-3 bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all font-bold text-sm"
              >
                <Sparkles className="w-4 h-4 text-black dark:text-white" />
                <span className="text-black dark:text-white">Ask AI</span>
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormData({
                      name: "",
                      mealType: "breakfast",
                      time: "",
                      days: [],
                      notes: "",
                      tags: "",
                  });
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-teal-700 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all text-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="text-black dark:text-black">Add Meal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Toggle */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${aiAccess ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">AI Analysis</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Allow interaction checks</p>
              </div>
            </div>
            <button
              onClick={toggleAiAccess}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                aiAccess ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`${
                  aiAccess ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform`}
              />
            </button>
          </div>

          {/* Filters & View Toggle */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 text-slate-400 border-r border-slate-100 dark:border-slate-800">
              <Filter className="w-4 h-4" />
            </div>
            
            <select 
              value={filter.mealType}
              onChange={(e) => { setFilter({...filter, mealType: e.target.value}); setTimeout(fetchData, 0); }}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              <option value="">All Meals</option>
              {mealTypes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
            
            <select 
              value={filter.day}
              onChange={(e) => { setFilter({...filter, day: e.target.value}); setTimeout(fetchData, 0); }}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
            >
              <option value="">All Days</option>
              {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="ml-auto flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No meals found</h3>
            <p className="text-slate-500 text-sm">Add a meal to start tracking your routine.</p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getMealColor(item.mealType)}`}>
                          {item.mealType}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{getMealIcon(item.mealType)}</div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">{item.name}</h3>
                          {item.time && (
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {item.time}
                            </div>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
                          {item.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-6">
                        {item.days.map(d => (
                          <span key={d} className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {d}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => askAI(item)}
                        className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                      >
                        <Bot className="w-4 h-4" />
                        Check Interactions
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Timeline View - UNIQUE FEATURE */}
            {viewMode === 'timeline' && (
              <div className="max-w-3xl mx-auto relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 py-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-teal-500" />
                    
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        <span className="block text-2xl font-black text-slate-900 dark:text-white">
                          {item.time || "--:--"}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {item.mealType}
                        </span>
                      </div>
                      
                      <div className="flex-grow">
                        <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-1">{item.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        {item.notes && <p className="text-sm text-slate-500 dark:text-slate-400">{item.notes}</p>}
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <button onClick={() => handleEdit(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingItem ? "Edit Meal" : "Add New Meal"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Food Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Oatmeal with Berries"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                    <select
                      name="mealType"
                      value={formData.mealType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    >
                      {mealTypes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          formData.days.includes(day)
                            ? "bg-teal-500 text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none resize-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="Comma separated tags"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 font-bold transition-all shadow-lg shadow-teal-500/20"
                  >
                    {editingItem ? "Save Changes" : "Add Meal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FoodRoutine;
