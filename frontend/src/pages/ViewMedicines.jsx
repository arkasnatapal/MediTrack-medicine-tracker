import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MedicineCard from '../components/MedicineCard';
import Loader from '../components/Loader';
import { useMedicine } from '../context/MedicineContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Filter, Package, Search, Sparkles, 
  LayoutGrid, Activity, AlertCircle, Clock,
  Zap, CheckCircle2, XCircle
} from 'lucide-react';
import EditMedicineModal from '../components/EditMedicineModal';
import OrganizeWithAIButton from '../components/OrganizeWithAIButton';
import OrganizationPreviewModal from '../components/OrganizationPreviewModal';
import DrugInteractionModal from '../components/DrugInteractionModal';
import api from '../api/api';

const ViewMedicines = () => {
  const navigate = useNavigate();
  const [editingMedicine, setEditingMedicine] = useState(null);
  const { medicines, loading, getMedicines } = useMedicine();
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const handleEditSave = () => {
    window.location.reload();
  };

  const handleOrganize = async () => {
    try {
      setOrganizationLoading(true);
      const response = await api.post(
        '/medicines/organize',
        { allowWebLookup: true }
      );

      if (response.data.success) {
        if (response.data.summary.alreadyOrganized) {
          alert(`✅ Medicines are already organized!\n\nNo changes detected.`);
        } else {
          setOrganizationData(response.data);
          setShowOrganizationModal(true);
        }
      }
    } catch (error) {
      console.error('Organization error:', error);
      alert(error.response?.data?.message || 'Failed to organize medicines');
    } finally {
      setOrganizationLoading(false);
    }
  };

  const handleAcceptOrganization = async (selectedMedicineIds) => {
    setShowOrganizationModal(false);
    await getMedicines();
    window.location.reload();
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine => {
      const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (medicine.form && medicine.form.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (medicine.category && medicine.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      const today = new Date();
      const expiry = new Date(medicine.expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filter === 'expiring') {
        return diffDays > 0 && diffDays <= 30;
      } else if (filter === 'expired') {
        return diffDays <= 0;
      }

      return true;
    });
  }, [medicines, searchQuery, filter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Creative Header Section - Matching MedicalReports */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium mb-3"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Inventory Dashboard</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                My Medicines
              </h1>
              <p className="text-teal-50 text-lg max-w-xl leading-relaxed">
                Track your inventory, monitor expiry dates, and keep your health organized.
              </p>
            </div>
            
            <div className="flex gap-4">
              <OrganizeWithAIButton 
                onOrganize={handleOrganize}
                loading={organizationLoading}
              />
              <Link 
                to="/add-medicine" 
                className="group relative px-6 py-3 bg-white text-teal-700 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="h-5 w-5 relative z-10" />
                <span className="relative z-10 dark:text-black">Add New</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search & Filter Section - Matching MedicalReports */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md group">
            <div className="absolute inset-0 bg-teal-500/5 rounded-2xl blur-md group-focus-within:bg-teal-500/10 transition-colors" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center px-4 py-3 transition-all group-focus-within:border-teal-500/50 group-focus-within:ring-4 group-focus-within:ring-teal-500/10">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ml-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button
              onClick={() => setShowInteractionModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
            >
              <Activity className="w-5 h-5" />
              <span className="hidden sm:inline">Check Interaction</span>
            </button>

            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-3 shadow-sm min-w-[180px]">
              <Filter className="w-4 h-4 text-teal-500 mr-2" />
              <select
                className="w-full bg-transparent text-gray-900 dark:text-white font-bold text-sm focus:outline-none cursor-pointer appearance-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">All Medicines</option>
                <option value="expiring" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Expiring Soon</option>
                <option value="expired" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Expired</option>
              </select>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-3 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm font-bold">
                {filteredMedicines.length} Items
              </span>
            </div>
          </div>
        </div>

        {/* Medicines Grid */}
        {filteredMedicines.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredMedicines.map((medicine) => (
              <motion.div
                key={medicine._id}
                variants={itemVariants}
              >
                <MedicineCard 
                  medicine={medicine} 
                  onEdit={setEditingMedicine}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                <Package className="w-10 h-10 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No medicines found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                We couldn't find any medicines matching your current filters.
              </p>
              <button 
                onClick={() => {setSearchQuery(''); setFilter('all');}}
                className="mt-6 px-8 py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors shadow-lg hover:shadow-teal-500/25"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {editingMedicine && (
          <EditMedicineModal
            medicine={editingMedicine}
            onClose={() => setEditingMedicine(null)}
            onSave={handleEditSave}
          />
        )}

        <OrganizationPreviewModal
          isOpen={showOrganizationModal}
          onClose={() => setShowOrganizationModal(false)}
          organizationData={organizationData}
          onAccept={handleAcceptOrganization}
        />

        <DrugInteractionModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          medicines={medicines}
        />
      </div>
    </div>
  );
};

export default ViewMedicines;
