import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Edit2, Trash2, Clock, Package, Pill } from 'lucide-react';
import { formatDate, getDaysUntilExpiry } from '../utils/formatDate';
import { useMedicine } from '../context/MedicineContext';
import ConfirmDialog from './ConfirmDialog';

const MedicineCard = ({ medicine, onEdit }) => {
  const { deleteMedicine } = useMedicine();
  const navigate = useNavigate();
  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Premium Status Configuration - Simplified for Performance
  let statusConfig = {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Good',
    indicator: 'bg-emerald-500'
  };
  
  if (daysUntilExpiry === null) {
    statusConfig = {
      bg: 'bg-slate-50 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      label: 'Update Required',
      indicator: 'bg-slate-500'
    };
  } else if (daysUntilExpiry < 0) {
    statusConfig = {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-400',
      label: 'Expired',
      indicator: 'bg-rose-500'
    };
  } else if (daysUntilExpiry <= 30) {
    statusConfig = {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Expiring Soon',
      indicator: 'bg-amber-500'
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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer h-full"
      onClick={handleCardClick}
    >
      {/* Card Container - Removed heavy blur/gradients */}
      <div className="relative h-full p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-teal-500/30 dark:hover:border-teal-500/30 transition-all duration-300 flex flex-col">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Pill className="w-3 h-3" />
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {medicine.form || medicine.category || 'Medicine'}
              </p>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {medicine.name}
            </h3>
          </div>
          
          {/* Lightweight Status Badge */}
          <div className={`px-2.5 py-1 rounded-lg ${statusConfig.bg} border ${statusConfig.border} flex items-center gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.indicator}`} />
            <span className={`text-[10px] font-bold ${statusConfig.text} uppercase tracking-wide`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        
        {/* Info Grid - Simplified backgrounds */}
        <div className="grid grid-cols-2 gap-2 mb-4 flex-grow">
          {/* Expiry Date */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-0.5 text-slate-400">
              <Calendar className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Expires</span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'Not Set'}
            </p>
          </div>

          {/* Days Remaining */}
          <div className={`p-2.5 rounded-xl border ${daysUntilExpiry <= 30 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}>
            <div className={`flex items-center gap-1.5 mb-0.5 ${daysUntilExpiry <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Remaining</span>
            </div>
            <p className={`text-xs font-bold ${daysUntilExpiry <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {daysUntilExpiry !== null 
                ? (daysUntilExpiry > 0 ? `${daysUntilExpiry} Days` : `${Math.abs(daysUntilExpiry)} Days Ago`)
                : 'Unknown'}
            </p>
          </div>

          {/* Stock */}
          {medicine.quantity !== undefined && (
            <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Package className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Stock</span>
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {medicine.quantity} {medicine.quantity === 1 ? 'Unit' : 'Units'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Simplified */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(medicine);
              } else {
                navigate(`/medicines/${medicine._id}`);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
            className="flex items-center justify-center px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
