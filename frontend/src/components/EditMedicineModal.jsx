import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Calendar, Pill, FileText, Hash, FlaskConical, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";

const EditMedicineModal = ({ medicine, onClose, onSave }) => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    form: "",
    quantity: "",
    expiryDate: "",
    mfgDate: "",
    batchNo: "",
    genericName: "",
    dosage: "",
    description: "",
  });

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name || "",
        form: medicine.form || medicine.category || "",
        quantity: medicine.quantity || "",
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split("T")[0] : "",
        mfgDate: medicine.mfgDate ? new Date(medicine.mfgDate).toISOString().split("T")[0] : "",
        batchNo: medicine.batchNumber || medicine.batchNo || "", // Handle both naming conventions if any
        genericName: medicine.genericName || "",
        dosage: medicine.dosage || "",
        description: medicine.description || "",
      });
    }
  }, [medicine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put(`/medicines/${medicine._id}`, formData);
      if (res.data.success) {
        notify.success("Medicine updated successfully");
        onSave?.(res.data.medicine);
        onClose();
      }
    } catch (error) {
      console.error("Error updating medicine:", error);
      notify.error(error.response?.data?.message || "Failed to update medicine");
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
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Medicine</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Update details for {medicine?.name}</p>
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
            <form id="edit-medicine-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name & Generic Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-500" /> Medicine Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. Paracetamol"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-blue-500" /> Generic Name
                  </label>
                  <input
                    type="text"
                    name="genericName"
                    value={formData.genericName}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. Acetaminophen"
                  />
                </div>
              </div>

              {/* Form & Dosage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Form</label>
                  <input
                    type="text"
                    name="form"
                    value={formData.form}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. Tablet, Syrup"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" /> Dosage
                  </label>
                  <input
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. 500mg"
                  />
                </div>
              </div>

              {/* Quantity & Batch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-purple-500" /> Batch Number
                  </label>
                  <input
                    type="text"
                    name="batchNo"
                    value={formData.batchNo}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" /> Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Manufacturing Date</label>
                  <input
                    type="date"
                    name="mfgDate"
                    value={formData.mfgDate}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" /> Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  placeholder="Additional notes..."
                />
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 backdrop-blur-md">
            <button
              type="submit"
              form="edit-medicine-form"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditMedicineModal;
