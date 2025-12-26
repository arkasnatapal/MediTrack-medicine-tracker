import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  X, Plus, AlertTriangle, CheckCircle, Search, Clock, Trash2, 
  Activity, Moon, Sun, Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/api';
import { useTheme } from '../context/ThemeContext';

const DrugInteractionModal = ({ isOpen, onClose, medicines }) => {
  const { theme, setTheme } = useTheme();
  const [selectedMedicines, setSelectedMedicines] = useState([
    { id: Date.now(), medicineName: '', time: '' },
    { id: Date.now() + 1, medicineName: '', time: '' }
  ]);
  const [analysisRaw, setAnalysisRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // New State for History
  const [view, setView] = useState('check'); // 'check' | 'history'
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleAddRow = () => {
    setSelectedMedicines([...selectedMedicines, { id: Date.now(), medicineName: '', time: '' }]);
  };

  const handleRemoveRow = (id) => {
    if (selectedMedicines.length > 2) {
      setSelectedMedicines(selectedMedicines.filter(item => item.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setSelectedMedicines(selectedMedicines.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const fetchHistory = async () => {
    setView('history');
    setHistoryLoading(true);
    try {
      const res = await api.get('/ai/interaction-history');
      if (res.data.success) {
        setHistory(res.data.history);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
        const res = await api.delete(`/ai/interaction-history/${id}`);
        if (res.data.success) {
            setHistory(history.filter(h => h._id !== id));
        }
    } catch (e) {
        console.error("Failed to delete history item", e);
    }
  };

  const loadHistoryItem = (item) => {
    setAnalysisRaw(item.analysis);
    setView('check');
    // Optionally populate the inputs too? The user asked to "show the analysis", so showing the result is priority.
    // Let's populate inputs for context if we can, but IDs mismatch. Just setting analysis is safer.
  };

  const handleCheckInteraction = async () => {
    // Validate
    const validMeds = selectedMedicines.filter(m => m.medicineName.trim() !== '');
    if (validMeds.length < 2) {
      setError("Please select at least two medicines to check.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisRaw(null);

    try {
      const payload = validMeds.map(m => ({
        name: m.medicineName,
        time: m.time || null
      }));

      const response = await api.post('/ai/check-interaction', { medicines: payload });
      
      if (response.data.success) {
        setAnalysisRaw(response.data.analysis);
      } else {
        setError(response.data.message || "Failed to analyze interactions.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An error occurred while checking interactions.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMedicines([
      { id: Date.now(), medicineName: '', time: '' },
      { id: Date.now() + 1, medicineName: '', time: '' }
    ]);
    setAnalysisRaw(null);
    setError(null);
    setView('check');
  };

  // Helper function to parse sections from the markdown
  const parsedAnalysis = useMemo(() => {
    if (!analysisRaw) return null;

    const sections = {
      summary: "",
      analysis: "",
      recommendation: "",
      verdictType: "neutral" // safe, caution, danger
    };

    // Regex to find sections. 
    // Assumes sections start with **Section Name**: or similar
    const summaryMatch = analysisRaw.match(/\*\*Summary Verdict\*\*:\s*(.*?)(\n|$)/i);
    const analysisMatch = analysisRaw.match(/\*\*Detailed Analysis\*\*:\s*([\s\S]*?)(?=\*\*Recommendation\*\*)/i);
    const recommendationMatch = analysisRaw.match(/\*\*Recommendation\*\*:\s*([\s\S]*?)(?=$|---)/i); // End at footer or EOF

    if (summaryMatch) sections.summary = summaryMatch[1].trim();
    if (analysisMatch) sections.analysis = analysisMatch[1].trim();
    if (recommendationMatch) sections.recommendation = recommendationMatch[1].trim();
    
    // Fallback if regex fails (e.g. AI format slightly off), just dump raw into analysis
    if (!sections.analysis && !sections.summary) {
        sections.analysis = analysisRaw;
    }

    // Determine verdict type
    const s = sections.summary.toLowerCase();
    if (s.includes('danger') || s.includes('risk') || s.includes('avoid') || s.includes('serious')) {
        sections.verdictType = 'danger';
    } else if (s.includes('caution') || s.includes('monitor') || s.includes('moderate')) {
        sections.verdictType = 'caution';
    } else if (s.includes('safe') || s.includes('no known') || s.includes('likely safe')) {
        sections.verdictType = 'safe';
    }

    return sections;
  }, [analysisRaw]);


  const availableMedicineNames = [...new Set(medicines.map(m => m.name))];

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 flex justify-between items-center text-white shrink-0">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Drug Interaction Checker
              </h2>
              <p className="text-teal-100 text-sm mt-1">
                AI-powered safety analysis for your meds.
              </p>
            </div>
             <div className="flex items-center gap-2">
               {view === 'check' ? (
                <button 
                  onClick={fetchHistory}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors font-medium text-sm flex items-center gap-1"
                  title="View History"
                >
                  <Clock className="w-5 h-5" /> 
                </button>
               ) : (
                <button 
                  onClick={() => setView('check')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors font-medium text-sm flex items-center gap-1"
                  title="Back to Check"
                >
                  <Plus className="w-5 h-5" /> 
                </button>
               )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50 dark:bg-slate-950/50">
            
            {view === 'history' ? (
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-500" /> Interaction History
                  </h3>
                  
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No history found.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {history.map((record) => (
                        <div 
                          key={record._id}
                          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-colors shadow-sm group relative"
                        >
                          <button
                            onClick={() => loadHistoryItem(record)}
                            className="absolute inset-0 w-full h-full"
                          />
                          
                          <div className="flex justify-between items-start mb-2 relative z-10 pointer-events-none">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(record.createdAt).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="text-teal-600 dark:text-teal-400 text-xs font-bold group-hover:underline pointer-events-auto cursor-pointer" onClick={() => loadHistoryItem(record)}>
                                View Result &rarr;
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHistory(record._id);
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors pointer-events-auto cursor-pointer p-1 -mr-1"
                                    title="Delete from history"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 relative z-10 pointer-events-none">
                            {record.medicines.map((m, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                                {m.name}
                              </span>
                            ))}
                          </div>
                          </div>

                      ))}
                    </div>
                  )}
               </div>
            ) : !analysisRaw ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-center">
                  Select medicines to check for potential interactions. Adding intake time helps improve accuracy.
                </p>

                {selectedMedicines.map((item, index) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value={item.medicineName}
                          onChange={(e) => handleChange(item.id, 'medicineName', e.target.value)}
                           className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none appearance-none text-gray-900 dark:text-white shadow-sm"
                        >
                          <option value="">Select Medicine</option>
                          {availableMedicineNames.map((name, idx) => (
                            <option key={`${name}-${idx}`} value={name}>{name}</option>
                          ))}
                        </select>
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="w-1/3">
                      <div className="relative">
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => handleChange(item.id, 'time', e.target.value)}
                           className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 dark:text-white shadow-sm"
                        />
                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {selectedMedicines.length > 2 && (
                      <button 
                        onClick={() => handleRemoveRow(item.id)}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={handleAddRow}
                  className="mx-auto text-teal-600 dark:text-teal-400 text-sm font-semibold flex items-center gap-1 hover:underline mt-2 justify-center"
                >
                  <Plus className="w-4 h-4" /> Add another medicine
                </button>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            ) : (
                /* Analysis Result View */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header Summary Card */}
                <div className={`p-6 rounded-3xl border ${
                    parsedAnalysis.verdictType === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    parsedAnalysis.verdictType === 'caution' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                }`}>
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-3 rounded-full ${
                             parsedAnalysis.verdictType === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                             parsedAnalysis.verdictType === 'caution' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' :
                             'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                        }`}>
                            {parsedAnalysis.verdictType === 'danger' ? <AlertTriangle className="w-8 h-8"/> :
                             parsedAnalysis.verdictType === 'caution' ? <AlertTriangle className="w-8 h-8"/> :
                             <CheckCircle className="w-8 h-8"/>}
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black tracking-tight ${
                                parsedAnalysis.verdictType === 'danger' ? 'text-red-700 dark:text-red-300' :
                                parsedAnalysis.verdictType === 'caution' ? 'text-amber-700 dark:text-amber-300' :
                                'text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {parsedAnalysis.summary}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">AI Safety Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Detailed Analysis */}
                    <BentoCard 
                        title="Analysis" 
                        icon={Activity} 
                        className="md:col-span-2 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                        iconColor="text-blue-500"
                    >
                         <ReactMarkdown>{parsedAnalysis.analysis}</ReactMarkdown>
                    </BentoCard>

                    {/* Recommendation */}
                    <BentoCard 
                        title="Recommendation" 
                        icon={Activity} 
                        className="md:col-span-2 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800" 
                        iconColor="text-purple-500"
                    >
                         <ReactMarkdown>{parsedAnalysis.recommendation}</ReactMarkdown>
                    </BentoCard>


                </div>
                
                 {/* Footer Disclaimer */}
                 <div className="flex gap-3 items-start p-4 rounded-xl bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        This is an AI-generated analysis based on general pharmaceutical knowledge. <strong>It is not professional medical advice. Please consult your doctor.</strong>
                    </p>
                 </div>

                <div className="flex justify-end pt-4">
                   <button 
                    onClick={() => {
                        setAnalysisRaw(null);
                        setView('check');
                    }}
                    className="text-sm text-slate-500 hover:text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <Activity className="w-4 h-4" /> Check another combination
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            
            {view === 'check' && !analysisRaw && (
              <button
                onClick={handleCheckInteraction}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Check Interaction
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

// --- Sub-components (Copied/Adapted from MedicineDetails) ---

const BentoCard = ({ title, icon: Icon, children, className = "", iconColor = "text-slate-400" }) => (
  <div className={`p-6 rounded-3xl border shadow-sm ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <h3 className="font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
    </div>
    <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
      {children}
    </div>
  </div>
);

export default DrugInteractionModal;

