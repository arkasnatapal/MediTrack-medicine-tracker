import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OCRUploader from "../components/OCRUploader";
import { useMedicine } from "../context/MedicineContext";

import Footer from "../components/Footer"
import { Save, Loader2, ArrowLeft, Check, Upload, Calendar, Clock, Pill, FileText, AlertCircle } from "lucide-react";

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

const AddMedicine = () => {
  const navigate = useNavigate();
  const { addMedicine } = useMedicine();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiData, setAiData] = useState(null);

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
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-2 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Add New Medicine
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                Enter details manually or scan the label for quick entry.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - OCR */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
              <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-500" />
                  Scan Label
                </h3>
                <OCRUploader onScanComplete={handleScanComplete} />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Upload a clear image of the medicine packaging to automatically extract details like name, expiry, and dosage.
                </p>
              </div>

              {aiData && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-3xl bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-xl border border-emerald-100 dark:border-emerald-800 shadow-lg"
                >
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5" /> Scanned Details
                  </h4>
                  <div className="space-y-3 mb-6 text-sm text-slate-700 dark:text-slate-300">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Name:</span>
                      <span className="font-semibold">{aiData.name || "—"}</span>
                    </div>
                    {aiData.expiry && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Expiry:</span>
                        <span>{aiData.expiry}</span>
                      </div>
                    )}
                    {aiData.dosage && (
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Dosage:</span>
                        <span>{aiData.dosage}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={applyAiData}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Auto-Fill Form
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column - Form */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="p-6 md:p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Info Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <Pill className="h-5 w-5 text-blue-500" />
                      Basic Information
                    </h3>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                        placeholder="e.g. Paracetamol"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="form" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Form</label>
                        <input
                          type="text"
                          id="form"
                          name="form"
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                          placeholder="e.g. Tablet"
                          value={formData.form}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
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
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      Important Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="expiryDate"
                          name="expiryDate"
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                          value={formData.expiryDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="mfgDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Manufacturing Date</label>
                        <input
                          type="date"
                          id="mfgDate"
                          name="mfgDate"
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                          value={formData.mfgDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="batchNo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch No</label>
                        <input
                          type="text"
                          id="batchNo"
                          name="batchNo"
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                          placeholder="e.g. BNO1234"
                          value={formData.batchNo}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="dosage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
                        <input
                          type="text"
                          id="dosage"
                          name="dosage"
                          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white"
                          placeholder="e.g. 500 mg"
                          value={formData.dosage}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:text-white resize-none"
                        placeholder="Additional notes..."
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Reminder Settings */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <Clock className="h-5 w-5 text-red-500" />
                      Reminders
                    </h3>
                    
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Enable reminders for this medicine</span>
                    </label>

                    {reminderEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-6 pl-2"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Times per day</label>
                          <div className="flex flex-wrap gap-3">
                            {reminderTimes.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <input
                                  type="time"
                                  className="bg-transparent border-none focus:ring-0 text-sm font-medium dark:text-white dark:[color-scheme:dark]"
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
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md transition-colors"
                                  >
                                    <span className="sr-only">Remove</span>
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            {reminderTimes.length < 4 && (
                              <button
                                type="button"
                                className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                onClick={() => setReminderTimes((prev) => [...prev, "09:00"])}
                              >
                                + Add time
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start date</label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                              value={reminderStartDate}
                              onChange={(e) => setReminderStartDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End date (optional)</label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                              value={reminderEndDate}
                              onChange={(e) => setReminderEndDate(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Days of week</label>
                          <div className="flex flex-wrap gap-2">
                            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => {
                              const active = reminderDaysOfWeek.includes(day);
                              return (
                                <button
                                  type="button"
                                  key={day}
                                  onClick={() => setReminderDaysOfWeek((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                    active
                                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105"
                                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => navigate("/medicines")}
                      className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 overflow-hidden disabled:opacity-70 disabled:hover:scale-100"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Save Medicine</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                
              </div>
            </motion.div>
            
          </div>
        </motion.div>
        
      </div>
                      
    </div>
    
  );
};

export default AddMedicine;
