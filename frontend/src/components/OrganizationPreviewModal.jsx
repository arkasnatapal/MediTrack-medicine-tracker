import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Folder, 
  Package,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
} from 'lucide-react';

const OrganizationPreviewModal = ({ isOpen, onClose, organizationData, onAccept }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedMedicines, setSelectedMedicines] = useState(new Set());
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  if (!isOpen || !organizationData) return null;

  const { summary } = organizationData;
  const { foldersCreated, medicinesOrganized, lowConfidenceItems, sourcesUsed, totalMedicines } = summary;

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleMedicine = (medicineId) => {
    const newSelected = new Set(selectedMedicines);
    if (newSelected.has(medicineId)) {
      newSelected.delete(medicineId);
    } else {
      newSelected.add(medicineId);
    }
    setSelectedMedicines(newSelected);
  };

  const selectAll = () => {
    setSelectedMedicines(new Set(medicinesOrganized.map(m => m.medicineId)));
  };

  const deselectAll = () => {
    setSelectedMedicines(new Set());
  };

  const handleAccept = () => {
    onAccept(Array.from(selectedMedicines));
  };

  const getSourceBadgeColor = (source) => {
    const colors = {
      openfda: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      rxnorm: 'bg-green-500/20 text-green-400 border-green-500/30',
      webscrape: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      heuristic: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      manual: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[source] || colors.heuristic;
  };

  const getSourceName = (source) => {
    const names = {
      openfda: 'OpenFDA',
      rxnorm: 'RxNorm',
      webscrape: 'Web Search',
      heuristic: 'Heuristic',
      manual: 'Manual',
    };
    return names[source] || source;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Organization Results</h2>
                    <p className="text-purple-100 text-sm">
                      {totalMedicines} medicines organized into {foldersCreated.length} folders
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <button
                  onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                  className="flex items-center gap-2 text-sm w-full"
                >
                  <Shield className="h-4 w-4" />
                  <span>Data sources used: {sourcesUsed.map(getSourceName).join(', ')}</span>
                  <Info className="h-4 w-4 ml-auto" />
                </button>
                {showPrivacyInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2 text-xs text-purple-100"
                  >
                    Medicine names were sent to external APIs for categorization. All data is cached locally to minimize future requests.
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6 space-y-6">
              {/* Low Confidence Warning */}
              {lowConfidenceItems.length > 0 && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-600 dark:text-orange-400">
                        {lowConfidenceItems.length} Low Confidence Items
                      </h3>
                      <p className="text-sm text-orange-600/80 dark:text-orange-400/80 mt-1">
                        Please review these categorizations carefully before accepting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Folders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Created Folders
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm px-3 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {foldersCreated.map((folder) => {
                  const folderMedicines = medicinesOrganized.filter(m =>
                    m.newFolders.includes(folder.name)
                  );
                  const isExpanded = expandedFolders.has(folder.id);

                  return (
                    <div
                      key={folder.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/50"
                    >
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {folder.name}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ({folder.medicineCount} medicines)
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 space-y-2">
                              {folderMedicines.map((medicine) => {
                                const isLowConfidence = lowConfidenceItems.some(
                                  item => item.medicineId === medicine.medicineId
                                );
                                const isSelected = selectedMedicines.has(medicine.medicineId);

                                return (
                                  <div
                                    key={medicine.medicineId}
                                    className={`p-3 rounded-xl border transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                    } ${
                                      isLowConfidence ? 'border-orange-500/50' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleMedicine(medicine.medicineId)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-slate-400" />
                                          <span className="font-medium text-slate-900 dark:text-white">
                                            {medicine.medicineName}
                                          </span>
                                          {isLowConfidence && (
                                            <AlertCircle className="h-4 w-4 text-orange-500" />
                                          )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                          <span
                                            className={`px-2 py-0.5 rounded-full border ${getSourceBadgeColor(
                                              medicine.source
                                            )}`}
                                          >
                                            {getSourceName(medicine.source)}
                                          </span>
                                          <span className="text-slate-500 dark:text-slate-400">
                                            Confidence: {(medicine.confidence * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedMedicines.size} of {medicinesOrganized.length} medicines selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={selectedMedicines.size === 0}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Accept Selected ({selectedMedicines.size})
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrganizationPreviewModal;
