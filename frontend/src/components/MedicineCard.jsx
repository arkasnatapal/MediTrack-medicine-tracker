import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Calendar, Edit2, Trash2, Clock, Package, Pill } from 'lucide-react';
import { formatDate, getDaysUntilExpiry } from '../utils/formatDate';
import { useMedicine } from '../context/MedicineContext';
import ConfirmDialog from './ConfirmDialog';

const MedicineCard = ({ medicine, onEdit }) => {
  const { deleteMedicine } = useMedicine();
  const navigate = useNavigate();
  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Premium Status Configuration
  let statusConfig = {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Good',
    indicator: 'bg-emerald-500'
  };
  
  if (daysUntilExpiry === null) {
    statusConfig = {
      bg: 'bg-slate-50 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-400',
      label: 'Update Info',
      indicator: 'bg-slate-400'
    };
  } else if (daysUntilExpiry < 0) {
    statusConfig = {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-100 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-400',
      label: 'Expired',
      indicator: 'bg-rose-500'
    };
  } else if (daysUntilExpiry <= 30) {
    statusConfig = {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Expiring',
      indicator: 'bg-amber-500'
    };
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation();
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
    <>
      <div 
        className="group relative cursor-pointer h-full transition-all duration-300 hover:-translate-y-1"
        onClick={handleCardClick}
      >
        <div className="relative h-full p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group-hover:shadow-xl group-hover:border-teal-500/30 dark:group-hover:border-teal-500/30 transition-all duration-300 flex flex-col overflow-hidden">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-300 flex-shrink-0">
                <Pill className="w-6 h-6" />
              </div>
              
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  {medicine.form || medicine.category || 'Medicine'}
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {medicine.name}
                </h3>
              </div>
            </div>
            
            {/* Compact Status Badge */}
            <div className={`px-2 py-1 rounded-lg ${statusConfig.bg} border ${statusConfig.border} flex items-center gap-1.5 flex-shrink-0`}>
              <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.indicator}`} />
              <span className={`text-[10px] font-bold ${statusConfig.text} uppercase tracking-wide`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5 flex-grow">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                <Calendar className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Expires</span>
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'Not Set'}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${daysUntilExpiry <= 30 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
              <div className={`flex items-center gap-1.5 mb-2 ${daysUntilExpiry <= 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Remaining</span>
              </div>
              <p className={`text-xs font-bold truncate ${daysUntilExpiry <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {daysUntilExpiry !== null 
                  ? (daysUntilExpiry > 0 ? `${daysUntilExpiry} Days` : `${Math.abs(daysUntilExpiry)} Days Ago`)
                  : 'Unknown'}
              </p>
            </div>
            
            {medicine.quantity !== undefined && (
              <div className="col-span-2 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group/stock">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Package className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Stock Level</span>
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/stock:text-indigo-500 transition-colors">
                  {medicine.quantity} {medicine.quantity === 1 ? 'Unit' : 'Units'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(medicine);
                else navigate(`/medicines/${medicine._id}`);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-all duration-300 group/btn"
            >
              <Edit2 className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
              Edit
            </button>
            <button 
              onClick={handleDeleteClick}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all duration-300 hover:rotate-6 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
    </>
  );
};

export default MedicineCard;
