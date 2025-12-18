import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Package,
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  Sparkles,
  Pill,
  Search
} from 'lucide-react';
import api from '../api/api';
import MedicineCard from '../components/MedicineCard';
import Loader from '../components/Loader';

const MedicineFolders = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderMedicines, setFolderMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medicines/folders');

      if (response.data.success) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderMedicines = async (folderId) => {
    try {
      setMedicinesLoading(true);
      const response = await api.get('/medicines');

      if (response.data.success) {
        const filtered = response.data.medicines.filter((med) =>
          med.folders?.some(f => (f._id || f).toString() === folderId.toString())
        );
        setFolderMedicines(filtered);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setMedicinesLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    fetchFolderMedicines(folder._id);
  };

  const handleBack = () => {
    setSelectedFolder(null);
    setFolderMedicines([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
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
                <Sparkles className="w-3 h-3" />
                <span>Smart Organization</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                {selectedFolder ? (
                  <>
                    <FolderOpen className="h-10 w-10 text-teal-200" />
                    {selectedFolder.name}
                  </>
                ) : (
                  <>
                    <Folder className="h-10 w-10 text-teal-200" />
                    Medicine Folders
                  </>
                )}
              </h1>
              <p className="text-teal-50 text-lg max-w-xl leading-relaxed">
                {selectedFolder 
                  ? "View and manage medicines in this category."
                  : "Organize your medicines into smart categories for better tracking."}
              </p>
            </div>

            {selectedFolder && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="group relative px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Folders</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {!selectedFolder ? (
            <motion.div
              key="folders"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {folders.length > 0 ? (
                folders.map((folder, index) => (
                  <motion.div
                    key={folder._id}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    onClick={() => handleFolderClick(folder)}
                    className="group relative bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-slate-700 cursor-pointer overflow-hidden"
                  >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-bl-[4rem] transition-all group-hover:scale-110" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: `${folder.color}20` }}
                        >
                          <Folder className="w-8 h-8" style={{ color: folder.color }} />
                        </div>
                        
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                          <ChevronRight className="w-4 h-4 dark:text-white" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {folder.name}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" />
                          {folder.medicineCount} {folder.medicineCount === 1 ? 'medicine' : 'medicines'}
                        </div>
                        {folder.isSystemGenerated && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                            <div className="flex items-center gap-1.5 text-purple-500 font-medium">
                              <Sparkles className="w-3 h-3" />
                              AI Generated
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                      <Folder className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No folders yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                      Use "Organize with AI" to create folders automatically or create one manually.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="medicines"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {medicinesLoading ? (
                <div className="py-24 flex justify-center">
                  <Loader text="Loading medicines..." />
                </div>
              ) : folderMedicines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {folderMedicines.map((medicine) => (
                    <motion.div key={medicine._id} variants={itemVariants}>
                      <MedicineCard medicine={medicine} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner -rotate-3">
                      <Package className="w-10 h-10 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No medicines here</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                      This folder is currently empty.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MedicineFolders;
