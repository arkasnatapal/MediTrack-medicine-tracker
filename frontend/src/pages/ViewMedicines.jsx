import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import MedicineCard from '../components/MedicineCard';
import SearchBar from '../components/SearchBar';
import Loader from '../components/Loader';
import { useMedicine } from '../context/MedicineContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, Package, Search, Sparkles, Folder } from 'lucide-react';
import EditMedicineModal from '../components/EditMedicineModal';
import OrganizeWithAIButton from '../components/OrganizeWithAIButton';
import OrganizationPreviewModal from '../components/OrganizationPreviewModal';
import api from '../api/api';

const ViewMedicines = () => {
  const navigate = useNavigate();
  const [editingMedicine, setEditingMedicine] = useState(null);
  const { medicines, loading, getMedicines } = useMedicine();
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);

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
        // Check if medicines are already organized
        if (response.data.summary.alreadyOrganized) {
          alert(`✅ Medicines are already organized!\n\nNo changes detected. Your ${response.data.summary.totalMedicines} medicines are already organized into ${response.data.summary.foldersCreated.length} folders.\n\nClick "Show Folders" to view them.`);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

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
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-[#0B0F17] overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen dark:mix-blend-overlay" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-10 h-screen overflow-y-auto scrollbar-hide">
        <motion.div 
          className="max-w-7xl mx-auto space-y-8 pb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3">
                <Package className="h-8 w-8 text-emerald-500" />
                My Medicines
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                Manage your complete medicine inventory
              </p>
            </div>
            <div className="flex gap-3">

              <OrganizeWithAIButton 
                onOrganize={handleOrganize}
                loading={organizationLoading}
              />
              <Link 
                to="/add-medicine" 
                className="group relative px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <Plus className="h-5 w-5" />
                <span>Add Medicine</span>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            className="flex flex-col md:flex-row gap-4 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicines by name, form, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Filter className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <select
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer pr-8 appearance-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2310b981'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.25rem'
                }}
              >
                <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Medicines</option>
                <option value="expiring" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Expiring Soon</option>
                <option value="expired" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Expired</option>
              </select>
            </div>
          </motion.div>

          {!loading && (
            <motion.div variants={itemVariants} className="flex items-center gap-2 px-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {filteredMedicines.length} {filteredMedicines.length === 1 ? 'medicine' : 'medicines'} found
              </p>
            </motion.div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader text="Loading medicines..." />
            </div>
          ) : (
            <>
              {filteredMedicines.length > 0 ? (
                <motion.div 
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredMedicines.map((medicine, index) => (
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
                  variants={itemVariants}
                  className="text-center py-16 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700"
                >
                  <Package className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                    No medicines found matching your criteria
                  </p>
                  <button 
                    onClick={() => {setSearchQuery(''); setFilter('all');}}
                    className="mt-4 px-6 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition-colors"
                  >
                    Clear filters
                  </button>
                </motion.div>
              )}
            </>
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
        </motion.div>
      </div>
    </div>
  );
};

export default ViewMedicines;
