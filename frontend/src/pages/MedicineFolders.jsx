import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Package,
  ArrowLeft,
  ChevronRight,
  FolderOpen,
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
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedFolder && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </button>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center gap-3">
                  {selectedFolder ? (
                    <>
                      <FolderOpen className="h-8 w-8" style={{ color: selectedFolder.color }} />
                      {selectedFolder.name}
                    </>
                  ) : (
                    <>
                      <Folder className="h-8 w-8 text-purple-500" />
                      Medicine Folders
                    </>
                  )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                  {selectedFolder
                    ? `${folderMedicines.length} medicines in this folder`
                    : `${folders.length} folders organized`}
                </p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader text="Loading folders..." />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!selectedFolder ? (
                <motion.div
                  key="folders"
                  variants={containerVariants}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {folders.length > 0 ? (
                    folders.map((folder) => (
                      <motion.div
                        key={folder._id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleFolderClick(folder)}
                          className="w-full p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all text-left group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div
                              className="p-3 rounded-2xl"
                              style={{ backgroundColor: `${folder.color}20` }}
                            >
                              <Folder className="h-8 w-8" style={{ color: folder.color }} />
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {folder.name}
                          </h3>

                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Package className="h-4 w-4" />
                            <span>
                              {folder.medicineCount} {folder.medicineCount === 1 ? 'medicine' : 'medicines'}
                            </span>
                          </div>

                          {folder.isSystemGenerated && (
                            <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">
                              <span>AI Generated</span>
                            </div>
                          )}
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      className="col-span-full text-center py-16 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700"
                    >
                      <Folder className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                        No folders yet
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">
                        Use "Organize with AI" to create folders automatically
                      </p>
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
                    <div className="py-12 flex justify-center">
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
                      className="text-center py-16 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700"
                    >
                      <Package className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                        No medicines in this folder
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MedicineFolders;
