import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import ChartSection from '../components/ChartSection';
import MedicineCard from '../components/MedicineCard';
import Loader from '../components/Loader';
import { useMedicine } from '../context/MedicineContext';
import { useAuth } from '../context/AuthContext';
import { Plus, AlertTriangle, Package, Calendar, ArrowRight, Activity, TrendingUp, Zap, Search, ScanLine } from 'lucide-react';
import { getDaysUntilExpiry } from '../utils/formatDate';
import PendingRemindersWidget from '../components/PendingRemindersWidget';
import QuickFamilyWidget from '../components/QuickFamilyWidget';
import EditMedicineModal from '../components/EditMedicineModal';
import HealthTipWidget from '../components/HealthTipWidget';
import SearchModal from '../components/SearchModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { medicines, loading, getMedicines } = useMedicine();
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleEditSave = () => {
    window.location.reload();
  };


  // Calculate stats
  const totalMedicines = medicines.length;
  const expiringSoon = medicines.filter(m => {
    const days = getDaysUntilExpiry(m.expiryDate);
    return days > 0 && days <= 30;
  }).length;
  const expired = medicines.filter(m => getDaysUntilExpiry(m.expiryDate) <= 0).length;

  // Chart Data
  const formData = medicines.reduce((acc, curr) => {
    const form = curr.form || curr.category || 'Uncategorized';
    const found = acc.find(i => i.name === form);
    if (found) found.value++;
    else acc.push({ name: form, value: 1 });
    return acc;
  }, []);

  const expiryData = [
    { name: 'Expired', value: expired },
    { name: 'Expiring Soon', value: expiringSoon },
    { name: 'Good', value: totalMedicines - expired - expiringSoon },
  ];

  const recentMedicines = [...medicines]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // Animation Variants - Optimized for performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Faster stagger
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced movement
    visible: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.3 } }, // Simpler transition
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#020617] overflow-x-hidden transition-colors duration-500">
      {/* Dynamic Background - Optimized */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-gray-50 to-gray-50 dark:from-emerald-900/10 dark:via-[#020617] dark:to-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 dark:opacity-10 mix-blend-overlay" />
        
        {/* Static or Simplified Orbs for Mobile / Reduced Motion */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[80px] hidden md:block"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[80px] hidden md:block"
            />
            {/* Static fallback for mobile to save battery */}
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[60px] md:hidden" />
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[60px] md:hidden" />
          </>
        )}
      </div>

      <div className="relative z-10 p-4 md:p-8 lg:p-10">
        <motion.div 
          className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 tracking-tight">
                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
                  {user?.name?.split(' ')[0]}
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg">
                Your health overview for today.
              </p>
            </div>
            
            {/* Quick Actions for Mobile */}
            <div className="flex gap-3 w-full md:w-auto">
               <Link 
                to="/add-medicine" 
                className="flex-1 md:flex-none group relative px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Plus className="h-5 w-5 md:h-6 md:w-6 relative z-10" />
                <span className="relative z-10 text-sm md:text-base">Add Med</span>
              </Link>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
              >
                 <Search className="h-5 w-5" />
              </button>
            </div>
          </motion.div>



          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <div className="col-span-2 md:col-span-1">
                <StatCard 
                title="Total Medicines" 
                value={totalMedicines} 
                icon={Package} 
                color="blue" 
                trend="+2 this week"
                fullWidth
                />
            </div>
            <Link to="/expiring-medicines" className="block">
              <StatCard 
                title="Expiring" 
                value={expiringSoon} 
                icon={Calendar} 
                color="yellow" 
                trend="Action needed"
                alert={expiringSoon > 0}
                compact
              />
            </Link>
            <Link to="/expiring-medicines" className="block">
              <StatCard 
                title="Expired" 
                value={expired} 
                icon={AlertTriangle} 
                color="red" 
                trend="Dispose safely"
                alert={expired > 0}
                compact
              />
            </Link>
          </motion.div>

          {/* Health Tip Widget */}
          <motion.div variants={itemVariants}>
            <HealthTipWidget />
          </motion.div>

          {/* Action Center Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Pending Reminders Widget */}
            <motion.div variants={itemVariants}>
              <PendingRemindersWidget />
            </motion.div>

            {/* Quick Family Widget */}
            <motion.div variants={itemVariants}>
              <QuickFamilyWidget />
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <motion.div 
              variants={itemVariants} 
              className="h-72 md:h-96 p-4 md:p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg"
            >
              <ChartSection title="Inventory by Form" data={formData} type="bar" className="" />
            </motion.div>
            <motion.div 
              variants={itemVariants} 
              className="h-72 md:h-96 p-4 md:p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg"
            >
              <ChartSection title="Expiry Status" data={expiryData} type="pie" className="" />
            </motion.div>
          </div>

          {/* Recent Medicines */}
          <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recently Added
              </h2>
              <Link to="/medicines" className="text-sm font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 md:gap-2 group">
                View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader text="Loading recent medicines..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {recentMedicines.map((medicine, index) => (
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
                ))}
                {recentMedicines.length === 0 && (
                  <div className="col-span-3 py-12 md:py-16 text-center rounded-3xl bg-white/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 backdrop-blur-sm">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 md:h-10 md:w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-4">No medicines added yet.</p>
                    <Link to="/add-medicine" className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors inline-block">
                      Add your first medicine
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Edit Modal */}
        {editingMedicine && (
          <EditMedicineModal
            medicine={editingMedicine}
            onClose={() => setEditingMedicine(null)}
            onSave={handleEditSave}
          />
        )}

        {/* Search Modal */}
        <SearchModal 
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            medicines={medicines}
        />
      </div>
    </div>
  );
};

// Stylish Stat Card Component - Enhanced for Mobile
const StatCard = ({ title, value, icon: Icon, color, trend, alert, compact, fullWidth }) => {
  const colorStyles = {
    blue: "from-blue-500 to-indigo-500 shadow-blue-500/20",
    yellow: "from-amber-400 to-orange-500 shadow-orange-500/20",
    red: "from-red-500 to-rose-500 shadow-red-500/20",
  };

  const activeGradient = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-5 md:p-6 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg dark:shadow-2xl overflow-hidden group h-full ${fullWidth ? 'flex flex-row items-center justify-between' : ''}`}
    >
      {/* Background Glow - Reduced opacity for cleaner look */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${activeGradient} opacity-5 dark:opacity-10 blur-2xl group-hover:opacity-10 dark:group-hover:opacity-15 transition-opacity duration-500`} />
      
      <div className={`relative z-10 ${fullWidth ? 'flex-1' : ''}`}>
        <div className={`${fullWidth ? 'hidden' : 'flex'} ${compact ? 'w-10 h-10 rounded-xl mb-3' : 'w-12 h-12 md:w-14 md:h-14 rounded-2xl mb-4 md:mb-6'} bg-gradient-to-br ${activeGradient} items-center justify-center shadow-lg`}>
          <Icon className={`${compact ? 'h-5 w-5' : 'h-6 w-6 md:h-7 md:w-7'} text-white`} />
        </div>
        
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2 md:gap-3">
          <h3 className={`${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} font-black text-slate-900 dark:text-white`}>{value}</h3>
          {alert && (
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
          )}
        </div>
        
        {!compact && (
          <div className="mt-2 md:mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{trend}</span>
          </div>
        )}
      </div>

      {fullWidth && (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeGradient} flex items-center justify-center shadow-lg ml-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
