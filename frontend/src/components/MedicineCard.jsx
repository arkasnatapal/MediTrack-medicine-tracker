import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2, Clock, Package, Pill } from 'lucide-react';
import { formatDate, getDaysUntilExpiry } from '../utils/formatDate';
import { useMedicine } from '../context/MedicineContext';
import ConfirmDialog from './ConfirmDialog';
import { useState } from 'react';

const MedicineCard = ({ medicine, onEdit }) => {
  const { deleteMedicine } = useMedicine();
  const navigate = useNavigate();
  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Status Configuration
  let statusConfig = {
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-500',
    text: 'Good',
    glowColor: 'shadow-emerald-500/20'
  };
  
  if (daysUntilExpiry === null) {
    statusConfig = {
      gradient: 'from-slate-500 to-gray-500',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-500/20',
      iconColor: 'text-slate-500',
      text: 'Update Required',
      glowColor: 'shadow-slate-500/20'
    };
  } else if (daysUntilExpiry < 0) {
    statusConfig = {
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-500',
      text: 'Expired',
      glowColor: 'shadow-red-500/20'
    };
  } else if (daysUntilExpiry <= 30) {
    statusConfig = {
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500/20',
      iconColor: 'text-amber-500',
      text: 'Expiring Soon',
      glowColor: 'shadow-amber-500/20'
    };
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMedicine(medicine._id);
    setShowDeleteDialog(false);
  };

  const handleCardClick = () => {
    navigate(`/medicines/${medicine._id}`);
  };

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Glowing Border Effect on Hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${statusConfig.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur transition duration-500`} />
      
      {/* Card Container */}
      <div className="relative h-full p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <Pill className="w-full h-full transform rotate-12" />
        </div>

        {/* Header Section */}
        <div className="relative z-10 flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {medicine.name}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {medicine.form || medicine.category || 'General'}
            </p>
          </div>
          
          {/* Status Badge */}
          <div className={`relative px-3 py-1.5 rounded-xl ${statusConfig.bgColor} ${statusConfig.borderColor} border backdrop-blur-sm`}>
            <span className={`text-xs font-bold ${statusConfig.textColor} uppercase tracking-wide`}>
              {statusConfig.text}
            </span>
            {daysUntilExpiry < 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
        </div>
        
        {/* Info Section */}
        <div className="relative z-10 space-y-3 mb-6">
          {/* Expiry Date */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <Calendar className={`h-4 w-4 ${statusConfig.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Expires On</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'Not Set'}
              </p>
            </div>
          </div>

          {/* Days Until Expiry */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <Clock className={`h-4 w-4 ${statusConfig.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Time Remaining</p>
              <p className={`text-sm font-bold ${statusConfig.textColor}`}>
                {daysUntilExpiry !== null 
                  ? (daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : `${Math.abs(daysUntilExpiry)} days ago`)
                  : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Stock Quantity */}
          {medicine.quantity !== undefined && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                <Package className={`h-4 w-4 ${statusConfig.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Stock</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {medicine.quantity} {medicine.quantity === 1 ? 'unit' : 'units'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(medicine);
              } else {
                navigate(`/medicines/${medicine._id}`);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-200 hover:scale-105"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
            <span className="text-sm">Edit</span>
          </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-all duration-200 hover:scale-105"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete ${medicine.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </motion.div>
  );
};

export default MedicineCard;
