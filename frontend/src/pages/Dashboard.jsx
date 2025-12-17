import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChartSection from '../components/ChartSection';
import MedicineCard from '../components/MedicineCard';
import Loader from '../components/Loader';
import { useMedicine } from '../context/MedicineContext';
import { useAuth } from '../context/AuthContext';
import { Plus, AlertTriangle, Package, Calendar, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import { getDaysUntilExpiry } from '../utils/formatDate';
import PendingRemindersWidget from '../components/PendingRemindersWidget';
import EditMedicineModal from '../components/EditMedicineModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { medicines, loading, getMedicines } = useMedicine();
  const [editingMedicine, setEditingMedicine] = useState(null);
  const navigate = useNavigate();

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

  // Animation Variants
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
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#020617] overflow-hidden transition-colors duration-500">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-gray-50 to-gray-50 dark:from-emerald-900/20 dark:via-[#020617] dark:to-[#020617]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay" />
        
        {/* Animated Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <motion.div 
          className="max-w-7xl mx-auto space-y-8 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Welcome back, <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400">
                  {user?.name?.split(' ')[0]}!
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Here's your health inventory overview.
              </p>
            </div>
            <Link 
              to="/add-medicine" 
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Plus className="h-6 w-6 relative z-10" />
              <span className="relative z-10">Add Medicine</span>
            </Link>
          </motion.div>

          {/* Pending Reminders Widget */}
          <motion.div variants={itemVariants}>
            <PendingRemindersWidget />
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Medicines" 
              value={totalMedicines} 
              icon={Package} 
              color="blue" 
              trend="+2 this week"
            />
            <Link to="/expiring-medicines" className="block">
              <StatCard 
                title="Expiring Soon" 
                value={expiringSoon} 
                icon={Calendar} 
                color="yellow" 
                trend="Action needed"
                alert={expiringSoon > 0}
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
              />
            </Link>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div 
              variants={itemVariants} 
              className="h-96 p-8 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl"
            >
              <ChartSection title="Inventory by Form" data={formData} type="bar" className="" />
            </motion.div>
            <motion.div 
              variants={itemVariants} 
              className="h-96 p-8 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl"
            >
              <ChartSection title="Expiry Status" data={expiryData} type="pie" className="" />
            </motion.div>
          </div>

          {/* Recent Medicines */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recently Added
              </h2>
              <Link to="/medicines" className="text-sm font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader text="Loading recent medicines..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentMedicines.map((medicine, index) => (
                  <motion.div
                    key={medicine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MedicineCard 
                      medicine={medicine} 
                      onEdit={setEditingMedicine}
                    />
                  </motion.div>
                ))}
                {recentMedicines.length === 0 && (
                  <div className="col-span-3 py-16 text-center rounded-3xl bg-white/70 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">No medicines added yet.</p>
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
      </div>
    </div>
  );
};

// Stylish Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, alert }) => {
  const colorStyles = {
    blue: "from-blue-500 to-indigo-500 shadow-blue-500/20",
    yellow: "from-amber-400 to-orange-500 shadow-orange-500/20",
    red: "from-red-500 to-rose-500 shadow-red-500/20",
  };

  const activeGradient = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden group"
    >
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${activeGradient} opacity-5 dark:opacity-10 blur-3xl group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeGradient} flex items-center justify-center mb-6 shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">{value}</h3>
          {alert && (
            <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
          )}
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{trend}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
