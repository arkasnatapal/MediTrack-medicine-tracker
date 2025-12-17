import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Calendar, Filter, Search } from 'lucide-react';
import { useMedicine } from '../context/MedicineContext';
import MedicineCard from '../components/MedicineCard';
import Loader from '../components/Loader';
import { getDaysUntilExpiry } from '../utils/formatDate';
import EditMedicineModal from '../components/EditMedicineModal';

const ExpiringMedicines = () => {
  const { medicines, loading } = useMedicine();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'expired', 'expiring-soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMedicine, setEditingMedicine] = useState(null);

  const handleEditSave = () => {
    window.location.reload();
  };

  const filteredMedicines = useMemo(() => {
    let result = medicines.filter(m => {
      const days = getDaysUntilExpiry(m.expiryDate);
      if (filter === 'expired') return days <= 0;
      if (filter === 'expiring-soon') return days > 0 && days <= 30;
      return days <= 30; // Default 'all' shows both expired and expiring soon (<= 30 days)
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) || 
        (m.brand && m.brand.toLowerCase().includes(query))
      );
    }

    // Sort by expiry date (ascending: most urgent first)
    return result.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }, [medicines, filter, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
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
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
              >
                <ArrowLeft className="h-6 w-6 text-slate-700 dark:text-slate-200" />
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">
                  Expiring Medicines
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                  Track medicines that need attention soon.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-white/20 dark:border-slate-800 shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                All Alerts
              </button>
              <button
                onClick={() => setFilter('expiring-soon')}
                className={`px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filter === 'expiring-soon'
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Expiring Soon
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filter === 'expired'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Expired
              </button>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader text="Loading medicines..." />
            </div>
          ) : (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((medicine, index) => (
                  <motion.div
                    key={medicine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MedicineCard 
                      medicine={medicine} 
                      onEdit={setEditingMedicine}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    No Medicines Found
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {filter === 'all' 
                      ? "Great news! You don't have any expired or expiring medicines."
                      : filter === 'expired'
                      ? "No expired medicines found."
                      : "No medicines are expiring soon."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Edit Modal */}
        {editingMedicine && (
          <EditMedicineModal
            medicine={editingMedicine}
            onClose={() => setEditingMedicine(null)}
            onSave={handleEditSave}
          />
        )}
      </div>
    </div>
  );
};

export default ExpiringMedicines;
