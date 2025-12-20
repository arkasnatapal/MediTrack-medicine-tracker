import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OCRUploader from "../components/OCRUploader";
import { useMedicine } from "../context/MedicineContext";

import Footer from "../components/Footer"
import { 
  Save, Loader2, ArrowLeft, Check, Upload, Calendar, Clock, 
  Pill, FileText, AlertCircle, Sparkles, Bot, ChevronRight, Search, Info,
  Syringe, Droplets, Tablets
} from "lucide-react";
import api from "../api/api";

const monthNamesMap = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function parseDateFromString(str, { useLastDay = false } = {}) {
  if (!str || typeof str !== "string") return null;
  const lower = str.toLowerCase();
  let month = 1, year = 0, day = 1, foundMonth = null;

  for (const key of Object.keys(monthNamesMap)) {
    if (lower.includes(key)) { foundMonth = monthNamesMap[key]; break; }
  }

  const nums = (str.match(/\d+/g) || []).map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));

  if (foundMonth) {
    month = foundMonth;
    if (nums.length >= 1) year = nums[0];
  } else {
    if (nums.length === 0) return null;
    if (nums.length === 2) { month = nums[0]; year = nums[1]; day = 1; }
    else if (nums.length >= 3) {
      if (nums[0] > 31) { year = nums[0]; month = nums[1]; day = nums[2]; }
      else { day = nums[0]; month = nums[1]; year = nums[2]; }
    }
  }

  if (year > 0 && year < 100) year = 2000 + year;
  if (!year || year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  let date;
  if (useLastDay) date = new Date(year, month, 0);
  else date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

const getMedicineIcon = (category) => {
  const cat = category?.toLowerCase() || "";
  if (cat.includes("injection") || cat.includes("syringe")) return <Syringe className="w-10 h-10 text-rose-500" />;
  if (cat.includes("syrup") || cat.includes("liquid") || cat.includes("drop")) return <Droplets className="w-10 h-10 text-cyan-500" />;
  if (cat.includes("tablet") || cat.includes("capsule") || cat.includes("pill")) return <Tablets className="w-10 h-10 text-indigo-500" />;
  return <Pill className="w-10 h-10 text-emerald-500" />;
};

const AddMedicine = () => {
  const navigate = useNavigate();
  const { addMedicine } = useMedicine();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "", form: "", quantity: "1", expiryDate: "", mfgDate: "",
    batchNo: "", genericName: "", dosage: "", description: "",
  });

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState(["09:00"]);
  const [reminderStartDate, setReminderStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reminderEndDate, setReminderEndDate] = useState("");
  const [reminderDaysOfWeek, setReminderDaysOfWeek] = useState(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);

  const handleScanComplete = (data) => {
    const ai = data?.ai || data;
    setAiData(ai || null);
  };

  const applyAiData = () => {
    if (!aiData) return;
    const updates = {};
    if (aiData.name) updates.name = aiData.name;
    if (aiData.form) updates.form = aiData.form;
    if (aiData.generic_name) updates.genericName = aiData.generic_name;
    if (aiData.dosage) updates.dosage = aiData.dosage;
    if (aiData.batch_no) updates.batchNo = aiData.batch_no;
    if (aiData.expiry) {
      const expiryISO = parseDateFromString(aiData.expiry, { useLastDay: true });
      if (expiryISO) updates.expiryDate = expiryISO;
    }
    if (aiData.mfg_date) {
      const mfgISO = parseDateFromString(aiData.mfg_date, { useLastDay: false });
      if (mfgISO) updates.mfgDate = mfgISO;
    }
    if (aiData.raw_cleaned && typeof aiData.raw_cleaned === "string") {
      updates.description = aiData.raw_cleaned;
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleAISearch = async () => {
    if (!formData.name) {
      setSearchError("Please enter a medicine name first.");
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      // 1. Try Local Lookup
      const lookupRes = await api.post(`/medicine-catalog/lookup`, {
        query: formData.name
      });

      if (lookupRes.data.found) {
        setSearchResult(lookupRes.data.data);
      } else {
        // 2. If not found, trigger AI Search
        const aiRes = await api.post(`/medicine-catalog/ai-search`, {
          query: formData.name
        });
        setSearchResult(aiRes.data.data);
      }
    } catch (err) {
      console.error("AI Search Error:", err);
      setSearchError(err.response?.data?.message || "Failed to fetch medicine details.");
    } finally {
      setIsSearching(false);
    }
  };

  const applySearchResult = () => {
    if (!searchResult) return;
    
    setFormData(prev => ({
      ...prev,
      name: searchResult.brandName || prev.name,
      genericName: searchResult.genericName || prev.genericName,
      form: searchResult.category || prev.form,
      dosage: searchResult.dosageInfo || prev.dosage,
      description: `Common Uses: ${searchResult.commonUses?.join(", ")}\nPrecautions: ${searchResult.precautions?.join(", ")}`
    }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
    setSearchError(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.length > 1) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/medicine-catalog/search?query=${encodeURIComponent(value)}`);
          if (res.data.success && res.data.data.length > 0) {
            setSuggestions(res.data.data);
            setShowSuggestions(true);
            setActiveSuggestionIndex(-1); // Reset selection
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setActiveSuggestionIndex(-1);
          }
        } catch (err) {
          console.error("Autocomplete error:", err);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        selectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (medicine) => {
    setFormData(prev => ({
      ...prev,
      name: medicine.brandName,
      genericName: medicine.genericName || prev.genericName,
      form: medicine.category || prev.form,
      dosage: medicine.dosageInfo || prev.dosage,
      description: `Common Uses: ${medicine.commonUses?.join(", ")}\nPrecautions: ${medicine.precautions?.join(", ")}`
    }));
    setSearchResult(null); // Clear result to prevent showing the "Use This Data" card
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const reminderPayload = reminderEnabled
      ? { enabled: true, times: reminderTimes.filter(Boolean), startDate: reminderStartDate, endDate: reminderEndDate || null, daysOfWeek: reminderDaysOfWeek }
      : { enabled: false };
    const success = await addMedicine({ ...formData, reminder: reminderPayload });
    if (success) navigate("/medicines");
    setIsSubmitting(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Creative Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium mb-3 hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Dashboard</span>
              </motion.button>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                Add Medicine
              </h1>
              <p className="text-teal-50 text-lg max-w-xl leading-relaxed">
                Enter details manually or scan the label for quick entry using our AI-powered OCR.
              </p>
            </div>
            
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <Pill className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - OCR */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-bl-[4rem] transition-all group-hover:scale-110" />
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                Scan Label
              </h3>
              
              <div className="relative z-10">
                <OCRUploader onScanComplete={handleScanComplete} />
                <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Upload a clear image of the medicine packaging to automatically extract details like name, expiry, and dosage.
                  </p>
                </div>
              </div>
            </div>

            {aiData && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-lg border border-emerald-100 dark:border-emerald-900/30 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10" />
                
                <div className="relative z-10">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <Bot className="h-5 w-5" /> Scanned Details
                  </h4>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/30">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{aiData.name || "—"}</span>
                    </div>
                    {aiData.expiry && (
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{aiData.expiry}</span>
                      </div>
                    )}
                    {aiData.dosage && (
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Dosage</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{aiData.dosage}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={applyAiData}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto-Fill Form
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            
            {/* AI Search Result Card */}
            {searchResult && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-lg border border-indigo-100 dark:border-indigo-900/30 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10" />
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-md border border-gray-100 dark:border-slate-700">
                    {getMedicineIcon(searchResult.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {searchResult.brandName}
                          {searchResult.verified && <Check className="w-4 h-4 text-blue-500" />}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{searchResult.genericName}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        {searchResult.createdBy === 'ai' ? 'AI Generated' : 'Verified'}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Category</span>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{searchResult.category}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Dosage</span>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{searchResult.dosageInfo}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={applySearchResult}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Use This Data
                      </button>
                      <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/10 px-3 py-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                        <AlertCircle className="w-3 h-3" />
                        AI-assisted data. Please consult a doctor.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
              <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                
                {/* Basic Info Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700/50">
                    <Pill className="h-4 w-4 text-teal-500" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-5 py-4 pr-32 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                        placeholder="e.g. Paracetamol"
                        value={formData.name}
                        onChange={handleNameChange}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                        onFocus={() => formData.name.length > 1 && setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 max-h-60 overflow-y-auto z-50">
                          {suggestions.map((medicine, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                              onClick={() => selectSuggestion(medicine)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${
                                idx === activeSuggestionIndex ? "bg-gray-50 dark:bg-slate-700/50 ring-1 ring-inset ring-indigo-500/20" : ""
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                {React.cloneElement(getMedicineIcon(medicine.category), { className: "w-5 h-5" })}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{medicine.brandName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{medicine.genericName}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAISearch}
                        disabled={isSearching || !formData.name}
                        className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white disabled:text-gray-700 dark:disabled:text-white font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 z-10"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {isSearching ? "Searching..." : "AI Search"}
                      </button>
                    </div>
                    {searchError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {searchError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="form" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Form</label>
                      <input
                        type="text"
                        id="form"
                        name="form"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                        placeholder="e.g. Tablet"
                        value={formData.form}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                        placeholder="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700/50">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Important Dates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="expiryDate" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                        style={{ colorScheme: 'dark' }}
                        value={formData.expiryDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="mfgDate" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Manufacturing Date</label>
                      <input
                        type="date"
                        id="mfgDate"
                        name="mfgDate"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                        style={{ colorScheme: 'dark' }}
                        value={formData.mfgDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700/50">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="batchNo" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Batch No</label>
                      <input
                        type="text"
                        id="batchNo"
                        name="batchNo"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                        placeholder="e.g. BNO1234"
                        value={formData.batchNo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="dosage" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Dosage</label>
                      <input
                        type="text"
                        id="dosage"
                        name="dosage"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                        placeholder="e.g. 500 mg"
                        value={formData.dosage}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium resize-none"
                      placeholder="Additional notes..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700/50">
                    <Clock className="h-4 w-4 text-red-500" />
                    Reminders
                  </h3>
                  
                  <label className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent cursor-pointer hover:border-teal-500/20 transition-all group">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${reminderEnabled ? 'bg-teal-500 border-teal-500' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                      {reminderEnabled && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                    />
                    <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Enable reminders for this medicine</span>
                  </label>

                  {reminderEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-6 pl-2 border-l-2 border-gray-100 dark:border-slate-700 ml-3"
                    >
                      <div className="pl-6">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Times per day</label>
                        <div className="flex flex-wrap gap-3">
                          {reminderTimes.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 pl-4 pr-2 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
                              <input
                                type="time"
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 dark:text-white p-0"
                                style={{ colorScheme: 'dark' }}
                                value={t}
                                onChange={(e) => {
                                  const copy = [...reminderTimes];
                                  copy[idx] = e.target.value; 
                                  setReminderTimes(copy);
                                }}
                              />
                              {reminderTimes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setReminderTimes((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                                >
                                  <span className="sr-only">Remove</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              )}
                            </div>
                          ))}
                          {reminderTimes.length < 4 && (
                            <button
                              type="button"
                              className="px-4 py-2 text-sm font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors border border-dashed border-teal-200 dark:border-teal-800"
                              onClick={() => setReminderTimes((prev) => [...prev, "09:00"])}
                            >
                              + Add time
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Start date</label>
                          <input
                            type="date"
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                            style={{ colorScheme: 'dark' }}
                            value={reminderStartDate}
                            onChange={(e) => setReminderStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">End date (optional)</label>
                          <input
                            type="date"
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                            style={{ colorScheme: 'dark' }}
                            value={reminderEndDate}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="pl-6">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Days of week</label>
                        <div className="flex flex-wrap gap-2">
                          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => {
                            const active = reminderDaysOfWeek.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                onClick={() => setReminderDaysOfWeek((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])}
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
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => navigate("/medicines")}
                    className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity" />
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span className="dark:text-black text-white">Save Medicine</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </div>
  );
};

export default AddMedicine;
