import React, { useState } from "react";
import { X, Package, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { useNotification } from "../context/NotificationContext";
import ConfirmDialog from "./ConfirmDialog";

const RefillStockModal = ({ medicine, onClose, onRefillComplete }) => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showRefillInput, setShowRefillInput] = useState(false);
  const [refillQuantity, setRefillQuantity] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRefill = async () => {
    if (!refillQuantity || parseInt(refillQuantity) < 1) {
      notify.error("Please enter a valid quantity");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/pending-reminders/medicines/${medicine._id}/refill`, {
        quantity: parseInt(refillQuantity),
      });

      if (response.data.success) {
        notify.success(response.data.message);
        onRefillComplete?.();
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error("Error refilling medicine:", error);
      notify.error("Failed to refill medicine stock");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {

    try {
      setLoading(true);
      const response = await api.delete(`/pending-reminders/medicines/${medicine._id}/with-reminders`);

      if (response.data.success) {
        notify.success(response.data.message);
        onClose();
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error("Error deleting medicine:", error);
      notify.error("Failed to delete medicine");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <Package className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Stock Empty
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {medicine.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> You have run out of stock for this medicine. Would you like to refill or delete it?
              </p>
            </div>

            {showRefillInput ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Refill Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={refillQuantity}
                    onChange={(e) => setRefillQuantity(e.target.value)}
                    placeholder="Enter quantity to add"
                    className="input-field w-full"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRefillInput(false);
                      setRefillQuantity("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefill}
                    disabled={loading || !refillQuantity}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg "
                  >
                    {loading ? "Refilling..." : "Confirm Refill"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDeleteClick}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete
                </button>
                <button
                  onClick={() => setShowRefillInput(true)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Refill Stock
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete ${medicine.name} and all its reminders? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </AnimatePresence>
  );
};

export default RefillStockModal;
