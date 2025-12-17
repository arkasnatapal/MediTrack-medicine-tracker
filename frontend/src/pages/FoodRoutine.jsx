import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Clock,
  Calendar,
  Utensils,
  Check,
  X,
  Bot,
  Filter,
  Sparkles,
  ChefHat,
  Search
} from "lucide-react";
import Loader from "../components/Loader";

const API_URL = "http://localhost:5000/api";

const FoodRoutine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [aiAccess, setAiAccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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
        setItems(res.data.items);
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
      case 'breakfast': return 'from-orange-400 to-amber-500';
      case 'lunch': return 'from-emerald-400 to-teal-500';
      case 'dinner': return 'from-indigo-400 to-purple-500';
      case 'snack': return 'from-pink-400 to-rose-500';
      default: return 'from-slate-400 to-slate-500';
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
    <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#131823] border border-gray-200 dark:border-gray-800 shadow-xl p-8 md:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight"
              >
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <ChefHat className="w-8 h-8" />
                </div>
                Food Routine
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400 mt-3 text-lg max-w-xl"
              >
                Track your nutrition, plan your meals, and let AI ensure your diet complements your medication.
              </motion.p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => askAI(null)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Ask AI Assistant
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/25"
              >
                <Plus className="w-5 h-5" />
                Add Meal
              </motion.button>
            </div>
          </div>
        </div>

        {/* AI Access & Filters Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Toggle Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#131823] rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-colors ${aiAccess ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">AI Analysis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow AI to check interactions</p>
              </div>
            </div>
            <button
              onClick={toggleAiAccess}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                aiAccess ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`${
                  aiAccess ? "translate-x-6" : "translate-x-1"
                } inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform`}
              />
            </button>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white dark:bg-[#131823] rounded-3xl p-2 shadow-lg border border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto"
          >
            <div className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
              <Filter className="w-5 h-5" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="flex-1 flex items-center gap-2 p-2">
              <select 
                value={filter.mealType}
                onChange={(e) => { setFilter({...filter, mealType: e.target.value}); setTimeout(fetchData, 0); }}
                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <option value="">All Meals</option>
                {mealTypes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              
              <select 
                value={filter.day}
                onChange={(e) => { setFilter({...filter, day: e.target.value}); setTimeout(fetchData, 0); }}
                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <option value="">All Days</option>
                {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {(filter.day || filter.mealType) && (
                <button 
                  onClick={() => { setFilter({day:"", mealType:""}); setTimeout(fetchData, 0); }}
                  className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white dark:bg-[#131823] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700"
          >
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Utensils className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No food items yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
              Start building your food routine to get personalized health insights and medicine interaction checks.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-500/25"
            >
              Add Your First Meal
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white dark:bg-[#131823] rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all hover:shadow-xl relative overflow-hidden"
                >
                  {/* Decorative Gradient Header */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getMealColor(item.mealType)}`} />
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-br ${getMealColor(item.mealType)} text-white shadow-lg`}>
                        {getMealIcon(item.mealType)}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {item.mealType}
                        </span>
                        {item.time && (
                          <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-3 line-clamp-1">{item.name}</h3>
                  
                  {item.days.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl w-fit">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-medium">{item.days.join(", ")}</span>
                    </div>
                  )}

                  {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50 italic">
                          "{item.notes}"
                      </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => askAI(item)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-2xl transition-colors font-semibold group-hover:shadow-md"
                  >
                    <Bot className="w-4 h-4" />
                    Check Interactions
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Modal with Backdrop Blur */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-[#131823] rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-[#131823]/80 backdrop-blur-md z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {editingItem ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                  {editingItem ? "Edit Food Item" : "Add New Food"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Food Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Oatmeal with Berries"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                    />
                    <Utensils className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Meal Type</label>
                    <div className="relative">
                      <select
                        name="mealType"
                        value={formData.mealType}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none appearance-none"
                      >
                        {mealTypes.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                      </select>
                      <ChefHat className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time (Optional)</label>
                    <div className="relative">
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                      />
                      <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          formData.days.includes(day)
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-105"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any specific details, ingredients, or portion sizes..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="high-protein, low-carb (comma separated)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.02]"
                  >
                    {editingItem ? "Save Changes" : "Add Food"}
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
