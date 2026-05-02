import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlignLeft, Check, Trash2 } from 'lucide-react';
import axios from 'axios';

const CheckupModal = ({ isOpen, onClose, onSave, onDelete, checkup }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    color: '#10b981'
  });
  const [loading, setLoading] = useState(false);

  const colors = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Indigo', value: '#6366f1' }
  ];

  useEffect(() => {
    if (checkup) {
      setFormData({
        title: checkup.title || '',
        date: checkup.date ? new Date(checkup.date).toISOString().split('T')[0] : '',
        time: checkup.time || '',
        location: checkup.location || '',
        notes: checkup.notes || '',
        color: checkup.color || '#10b981'
      });
    } else {
      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        notes: '',
        color: '#10b981'
      });
    }
  }, [checkup, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      
      let res;
      if (checkup?._id) {
        res = await axios.put(`${API_URL}/checkups/${checkup._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post(`${API_URL}/checkups`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      onSave(res.data);
      onClose();
    } catch (err) {
      console.error('Error saving checkup:', err);
      alert('Failed to save checkup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this checkup?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      await axios.delete(`${API_URL}/checkups/${checkup._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onDelete(checkup._id);
      onClose();
    } catch (err) {
      console.error('Error deleting checkup:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl z-[101] overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {checkup ? 'Edit Checkup' : 'Add Checkup'}
                </h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 px-1">EVENT TITLE</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dental Appointment"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> DATE
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> TIME
                    </label>
                    <input
                      required
                      type="time"
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> LOCATION
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. City General Hospital"
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" /> NOTES (OPTIONAL)
                  </label>
                  <textarea
                    placeholder="Any special instructions..."
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium resize-none h-24"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-1">CHOOSE COLOR</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.value })}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center relative ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                      >
                        {formData.color === c.value && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {checkup && (
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      disabled={loading}
                      className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-slate-900 dark:bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : checkup ? 'Update Event' : 'Add to Calendar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckupModal;
