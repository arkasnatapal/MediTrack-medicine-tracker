import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Pill,
  Clock,
  AlertCircle,
  Bot,
  ArrowLeft,
  Activity,
  Info,
  Calendar,
  ShieldAlert,
  Utensils,
  Baby,
  FlaskConical,
  Thermometer,
  CheckCircle2,
  Edit,
  Trash2,
  Sparkles,
  Plus,
  RefreshCw
} from "lucide-react";
import MedicineIllustration from "../components/MedicineIllustration";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ConfirmDialog";
import AddReminderModal from "../components/AddReminderModal";
import EditMedicineModal from "../components/EditMedicineModal";
import InfoDialog from "../components/InfoDialog";

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [infoDialog, setInfoDialog] = useState({ isOpen: false, title: "", message: "", variant: "info" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [medRes, remRes] = await Promise.all([
          api.get(`/medicines/${id}`),
          api.get(`/reminders/by-medicine/${id}`),
        ]);

        const medData = medRes.data;
        const remData = remRes.data;

        if (!medData.success) throw new Error(medData.message || "Failed to load medicine");
        setMedicine(medData.medicine);

        if (remData.success) setReminders(remData.reminders || []);
      } catch (e) {
        console.error(e);
        setError(e.response?.data?.message || e.message || "Failed to load medicine details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchAI = async () => {
      if (!medicine) return;
      
      // Check LocalStorage cache first
      const cacheKey = `insights_${medicine._id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          setAiInsights(parsedCache);
          setAiLoading(false);
          // Optional: Re-fetch in background if needed, but user wants speed so we trust cache
          // If DB has newer, we could fetch, but for now let's rely on cache + DB check in API
        } catch (e) {
          console.error("Cache parse error", e);
        }
      }

      try {
        // If no cache, or just to be safe, we call API. 
        // The API now checks DB cache too, so it should be fast.
        // If we already have local cache, we might skip this or do it silently?
        // Let's do it if no local cache, or if we want to ensure freshness.
        if (!cached) {
            setAiLoading(true);
        }
        
        const res = await api.post("/ai/medicine-insights", {
          medicineId: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          dosage: medicine.dosage,
          form: medicine.form,
        });
        const data = res.data;
        if (data.success) {
            setAiInsights(data.insights);
            localStorage.setItem(cacheKey, JSON.stringify(data.insights));
        }
      } catch (e) {
        console.error("AI insights error:", e);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAI();
  }, [medicine]);

  const handleRetryInsights = async () => {
    if (!medicine) return;
    try {
      setAiLoading(true);
      const res = await api.post("/ai/medicine-insights", {
        medicineId: medicine._id,
        name: medicine.name,
        genericName: medicine.genericName,
        dosage: medicine.dosage,
        form: medicine.form,
        forceRefresh: true, // Force regeneration
      });
      const data = res.data;
      if (data.success) {
        setAiInsights(data.insights);
        const cacheKey = `insights_${medicine._id}`;
        localStorage.setItem(cacheKey, JSON.stringify(data.insights));
      }
    } catch (e) {
      console.error("AI retry error:", e);
      setInfoDialog({
        isOpen: true,
        title: "Error",
        message: "Failed to refresh insights. Please try again.",
        variant: "error"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = () => {
    // navigate(`/edit-medicine/${id}`); // Old way
    setShowEditModal(true); // New way
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/medicines/${id}`);
      navigate("/medicines");
    } catch (e) {
      console.error("Failed to delete medicine:", e);
      setInfoDialog({
        isOpen: true,
        title: "Error",
        message: "Failed to delete medicine. Please try again.",
        variant: "error"
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleReminderSaved = () => {
    // Refresh reminders list
    api.get(`/reminders/by-medicine/${id}`).then(res => {
        if (res.data.success) setReminders(res.data.reminders || []);
    });
  };

  const handleMedicineUpdated = (updatedMed) => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="animate-pulse">Loading medicine details...</p>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-red-500 mb-4">{error || "Medicine not found"}</p>
          <button
            onClick={() => navigate("/medicines")}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            Back to Medicines
          </button>
        </div>
      </div>
    );
  }

  const mainReminder = reminders[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full min-h-full bg-gray-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-500/30 transition-colors duration-300">
      
      <div className="p-4 md:p-8 pb-4">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* LEFT COLUMN - STICKY HERO */}
          <div className="lg:col-span-4 lg:sticky lg:top-4 h-fit space-y-6">
            <motion.button
              variants={itemVariants}
              onClick={() => navigate("/medicines")}
              className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to library
            </motion.button>

            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl">
                <MedicineIllustration
                  name={medicine.name}
                  form={medicine.form}
                  dosage={medicine.dosage}
                  imageUrl={aiInsights?.image_url}
                  images={aiInsights?.images}
                  isLoading={aiLoading}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 tracking-tight">
                {medicine.name}
              </h1>
              {medicine.genericName && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400/80 font-medium text-lg">
                  <FlaskConical className="h-5 w-5" />
                  <span>{medicine.genericName}</span>
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-3">
              <button 
                onClick={handleEdit}
                className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-white font-medium transition-all flex items-center justify-center gap-2 group shadow-sm"
              >
                <Edit className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-white transition-colors" />
                Edit Details
              </button>
              <button 
                onClick={handleRetryInsights}
                disabled={aiLoading}
                className="py-3 px-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh AI Insights"
              >
                <RefreshCw className={`h-5 w-5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="py-3 px-4 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 transition-all flex items-center justify-center shadow-sm"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <StatCard label="Form" value={medicine.form} icon={Pill} />
              <StatCard label="Dosage" value={medicine.dosage} icon={Activity} />
              <StatCard label="Stock" value={medicine.quantity} icon={CheckCircle2} highlight={medicine.quantity < 10} />
              <StatCard 
                label="Expires" 
                value={medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : "—"} 
                icon={Calendar} 
              />
            </motion.div>
          </div>

          {/* RIGHT COLUMN - SCROLLABLE CONTENT */}
          <div className="lg:col-span-8 space-y-8 pb-4">
            
            {/* Schedule Section */}
            <motion.section variants={itemVariants}>
              <SectionHeader title="Schedule & Reminders" icon={Clock} />
              <div className="rounded-3xl bg-white/50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/5 p-6 backdrop-blur-sm relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                {mainReminder ? (
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Frequency</p>
                      <p className="text-2xl font-medium text-slate-900 dark:text-white">
                        {mainReminder.times?.length || 0} times <span className="text-slate-400 dark:text-slate-500 text-lg">/ day</span>
                      </p>
                    </div>
                    <div className="h-px md:h-12 w-full md:w-px bg-gray-200 dark:bg-white/10" />
                    <div className="space-y-1">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Times</p>
                      <div className="flex flex-wrap gap-2">
                        {mainReminder.times?.map((t, i) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-sm font-medium border border-blue-100 dark:border-blue-500/20">
                            {t}
                          </span>
                        )) || "—"}
                      </div>
                    </div>
                    <div className="h-px md:h-12 w-full md:w-px bg-gray-200 dark:bg-white/10" />
                    <div className="space-y-1">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Duration</p>
                      <p className="text-slate-700 dark:text-slate-200">
                        {mainReminder.startDate ? new Date(mainReminder.startDate).toLocaleDateString() : "—"} 
                        <span className="text-slate-400 dark:text-slate-500 mx-2">to</span>
                        {mainReminder.endDate ? new Date(mainReminder.endDate).toLocaleDateString() : "Forever"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No active reminders set for this medicine.</p>
                    <button 
                      onClick={() => setShowAddReminder(true)}
                      className="mt-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                      <Plus className="h-4 w-4" /> Add Reminder
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* AI Insights Bento Grid */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="AI Health Insights" icon={Sparkles} color="text-purple-500 dark:text-purple-400" />
                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400/70 bg-purple-100 dark:bg-purple-500/10 px-3 py-1 rounded-full animate-pulse">
                    <Bot className="h-3 w-3" />
                    Generating insights...
                  </div>
                )}
              </div>

              {!aiLoading && !aiInsights && (
                 <div className="p-8 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800 text-center text-slate-500">
                    Insights unavailable.
                 </div>
              )}

              {aiInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Uses - Large Card */}
                  <BentoCard 
                    title="Primary Uses" 
                    icon={Activity}
                    className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900/40 border-emerald-200 dark:border-emerald-500/20"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                  >
                    {aiInsights.primary_uses}
                  </BentoCard>

                  {/* How to Take */}
                  <BentoCard 
                    title="How to Take" 
                    icon={Utensils}
                    className="bg-white dark:bg-slate-900/40 border-blue-200 dark:border-blue-500/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                  >
                    {aiInsights.how_to_take_general}
                  </BentoCard>

                  {/* Side Effects */}
                  <BentoCard 
                    title="Side Effects" 
                    icon={AlertCircle}
                    className="bg-white dark:bg-slate-900/40 border-red-200 dark:border-red-500/20"
                    iconColor="text-red-600 dark:text-red-400"
                  >
                    {aiInsights.common_side_effects}
                  </BentoCard>

                  {/* Precautions - Large Card */}
                  <BentoCard 
                    title="Precautions & Warnings" 
                    icon={ShieldAlert}
                    className="md:col-span-2 bg-white dark:bg-slate-900/40 border-yellow-200 dark:border-yellow-500/20"
                    iconColor="text-yellow-600 dark:text-yellow-400"
                  >
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">When to avoid</span>
                        <p>{aiInsights.when_to_avoid_or_be_careful}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                           <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Food & Alcohol</span>
                           <p className="text-sm text-slate-600 dark:text-slate-300">{aiInsights.food_and_alcohol_precautions}</p>
                        </div>
                        <div>
                           <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Special Groups</span>
                           <p className="text-sm text-slate-600 dark:text-slate-300">{aiInsights.special_population_precautions}</p>
                        </div>
                      </div>
                    </div>
                  </BentoCard>

                  {/* Ingredients */}
                  <BentoCard 
                    title="Ingredients" 
                    icon={FlaskConical}
                    className="bg-white dark:bg-slate-900/40 border-gray-200 dark:border-slate-700/30"
                    iconColor="text-slate-500 dark:text-slate-400"
                  >
                    {aiInsights.ingredient_summary}
                  </BentoCard>

                  {/* Disclaimer */}
                  <div className="md:col-span-2 p-4 rounded-2xl bg-gray-100 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-800 flex gap-3 items-start">
                    <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {aiInsights.disclaimer || "Always consult a doctor. This information is for educational purposes only."}
                    </p>
                  </div>
                </div>
              )}
            </motion.section>
          </div>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Medicine"
          message={`Are you sure you want to delete ${medicine.name}? This action cannot be undone.`}
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          type="danger"
        />

        {/* Add Reminder Modal */}
        {showAddReminder && (
          <AddReminderModal
            medicineId={medicine._id}
            medicineName={medicine.name}
            onClose={() => setShowAddReminder(false)}
            onSave={handleReminderSaved}
          />
        )}

        {/* Edit Medicine Modal */}
        {showEditModal && (
          <EditMedicineModal
            medicine={medicine}
            onClose={() => setShowEditModal(false)}
            onSave={handleMedicineUpdated}
          />
        )}
        {/* Info Dialog */}
        <InfoDialog
          isOpen={infoDialog.isOpen}
          onClose={() => setInfoDialog({ ...infoDialog, isOpen: false })}
          title={infoDialog.title}
          message={infoDialog.message}
          variant={infoDialog.variant}
        />
      </div>
    </div>
  );
};

// Sub-components for cleaner code

const SectionHeader = ({ title, icon: Icon, color = "text-slate-900 dark:text-slate-200" }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-2 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200">{title}</h2>
  </div>
);

const StatCard = ({ label, value, icon: Icon, highlight = false }) => (
  <div className={`p-4 rounded-2xl border ${highlight ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-white dark:bg-slate-900/50 border-gray-200 dark:border-white/5'} backdrop-blur-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`h-4 w-4 ${highlight ? 'text-red-500 dark:text-red-400' : 'text-slate-500'}`} />
      <span className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-red-600 dark:text-red-300' : 'text-slate-500'}`}>{label}</span>
    </div>
    <p className={`text-lg font-semibold truncate ${highlight ? 'text-red-700 dark:text-red-200' : 'text-slate-900 dark:text-slate-200'}`}>{value || "—"}</p>
  </div>
);

const BentoCard = ({ title, icon: Icon, children, className = "", iconColor = "text-slate-400" }) => (
  <div className={`p-6 rounded-3xl border backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors shadow-sm ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <h3 className="font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
    </div>
    <div className="text-slate-600 dark:text-slate-300/90 text-sm leading-relaxed whitespace-pre-line">
      {children}
    </div>
  </div>
);

export default MedicineDetails;
