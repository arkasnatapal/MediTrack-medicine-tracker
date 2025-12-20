import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Folder, FileText, Image as ImageIcon, Trash2, 
  Bot, Calendar, Plus, X, Activity, ChevronRight, Search, Filter,
  Loader2, AlertCircle, FileHeart, Stethoscope, Pill, Sparkles,
  ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import MarkdownRenderer from '../components/MarkdownRenderer';
import api from '../api/api';

const MedicalReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Image Viewer State
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);

  // Upload Form State
  const [folderName, setFolderName] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!folderName || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('folderName', folderName);
    formData.append('reportDate', reportDate);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setShowUploadModal(false);
        setFolderName('');
        setFiles([]);
        fetchReports();
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    setDeleting(true);
    try {
      const res = await api.delete(`/reports/${reportToDelete._id}`);
      if (res.status === 200) {
        fetchReports();
        if (selectedReport?._id === reportToDelete._id) setSelectedReport(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
      setReportToDelete(null);
    }
  };

  const handleAnalyze = async (report) => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/reports/analyze/${report._id}`);
      if (res.data.success) {
        const updatedReports = reports.map(r => 
          r._id === report._id ? { ...r, aiAnalysis: res.data.analysis } : r
        );
        setReports(updatedReports);
        setSelectedReport({ ...report, aiAnalysis: res.data.analysis });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredReports = reports.filter(report => 
    report.folderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Creative Header Section */}
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
                <span>AI-Powered Health Insights</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                Medical Reports
              </h1>
              <p className="text-teal-50 text-lg max-w-xl leading-relaxed">
                Securely store, organize, and analyze your health records with advanced AI diagnostics.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="group relative px-8 py-4 bg-white text-teal-700 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10 dark:text-black">Upload Report</span>
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-0 bg-teal-500/5 rounded-2xl blur-md group-focus-within:bg-teal-500/10 transition-colors" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center px-4 py-3 transition-all group-focus-within:border-teal-500/50 group-focus-within:ring-4 group-focus-within:ring-teal-500/10">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search your medical history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ml-3 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
              {filteredReports.length} Reports
            </span>
          </div>
        </div>

        {/* Reports Grid - Creative Layout */}
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 shadow-inner rotate-3">
                <Folder className="w-10 h-10 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No reports found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                {searchTerm ? "Try adjusting your search terms" : "Upload your first medical report to unlock AI-powered insights."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report._id}
                layoutId={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedReport(report)}
                className="group relative bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-slate-700 cursor-pointer overflow-hidden"
              >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-bl-[4rem] transition-all group-hover:scale-110" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${
                      report.aiAnalysis 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' 
                        : 'bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 text-teal-600 dark:text-teal-400'
                    }`}>
                      {report.aiAnalysis ? (
                        <Bot className="w-8 h-8" />
                      ) : (
                        <FileHeart className="w-8 h-8" />
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(report); }}
                      className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {report.folderName}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.reportDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {report.files.length} Files
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700/50">
                    {report.aiAnalysis ? (
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                        </span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Analyzed</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Analysis</span>
                    )}
                    
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ChevronRight className="w-4 h-4 dark:text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal Portal */}
      {showUploadModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Report</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload documents for analysis</p>
                  </div>
                  <button 
                    onClick={() => setShowUploadModal(false)} 
                    className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Report Name</label>
                    <input
                      type="text"
                      required
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="e.g., Annual Checkup Results"
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Date</label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-teal-500/20 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none font-medium"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Documents</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all cursor-pointer relative group">
                      <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-teal-500" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {files.length > 0 ? `${files.length} files selected` : "Drop files here or click to upload"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, PNG up to 10MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader size="sm" color="currentColor" /> : "Create Report"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Report Details Portal - Full Screen Overlay Style */}
      {selectedReport && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative bg-[#F8FAFC] dark:bg-[#0B0F17] rounded-[2.5rem] w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-2xl flex items-center justify-center shadow-sm">
                    <FileHeart className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedReport.folderName}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedReport.reportDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="p-3 bg-gray-50 dark:bg-slate-700 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Files (3 cols) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" /> 
                        Documents ({selectedReport.files.length})
                      </h3>
                      <div className="space-y-4">
                        {selectedReport.files.map((file, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedImage(file.url);
                              setZoom(1);
                              setImageLoading(true);
                            }}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group border border-transparent hover:border-teal-200 dark:hover:border-teal-800 cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <ImageIcon className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.originalName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click to view</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Analysis (9 cols) */}
                  <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-1 shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
                      
                      {selectedReport.aiAnalysis?.summary ? (
                        <div className="p-8 space-y-8 animate-fadeIn">
                          {/* Summary Card */}
                          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                              <h4 className="flex items-center gap-3 text-xl font-bold mb-4">
                                <Bot className="w-6 h-6 text-indigo-200" /> 
                                AI Executive Summary
                              </h4>
                              <p className="text-indigo-50 leading-relaxed text-lg font-medium">
                                {selectedReport.aiAnalysis.summary}
                              </p>
                            </div>
                          </div>

                          {/* Stats & Key Findings Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Health Score Chart */}
                            <div className="bg-gray-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700/50">
                              <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-teal-500" /> Health Score
                              </h4>
                              <div className="h-48 w-full relative flex items-end justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={[{ name: 'Score', value: selectedReport.aiAnalysis.healthScore || 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip 
                                      cursor={{ fill: 'transparent' }}
                                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[20, 20, 0, 0]} barSize={80} animationDuration={1500}>
                                      <Cell fill={
                                        (selectedReport.aiAnalysis.healthScore || 0) > 80 ? '#10b981' : 
                                        (selectedReport.aiAnalysis.healthScore || 0) > 50 ? '#f59e0b' : '#ef4444'
                                      } />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-2 rounded-2xl shadow-sm">
                                  <span className={`text-4xl font-black ${
                                    (selectedReport.aiAnalysis.healthScore || 0) > 80 ? 'text-emerald-500' : 
                                    (selectedReport.aiAnalysis.healthScore || 0) > 50 ? 'text-amber-500' : 'text-red-500'
                                  }`}>
                                    {selectedReport.aiAnalysis.healthScore || 'N/A'}
                                  </span>
                                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mt-1">Out of 100</span>
                                </div>
                              </div>
                            </div>

                            {/* Key Findings List */}
                            <div className="bg-gray-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700/50">
                              <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Search className="w-5 h-5 text-purple-500" /> Key Findings
                              </h4>
                              <ul className="space-y-4">
                                {selectedReport.aiAnalysis.keyFindings?.map((finding, idx) => (
                                  <li key={idx} className="flex items-start gap-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                    </div>
                                    <span className="leading-relaxed font-medium">{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Detailed Analysis */}
                          <div className="bg-gray-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700/50">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                              <Stethoscope className="w-5 h-5 text-blue-500" /> Detailed Clinical Analysis
                            </h4>
                            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                              <MarkdownRenderer content={selectedReport.aiAnalysis.detailedAnalysis} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-black">
                          <div className="relative mb-8">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                            <div className="relative w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
                              <Bot className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          
                          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            Unlock AI Health Insights
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-10 leading-relaxed text-lg">
                            Our advanced AI model will analyze your medical documents to extract key metrics, identify potential issues, and provide a comprehensive health summary.
                          </p>
                          
                          <button
                            onClick={() => handleAnalyze(selectedReport)}
                            disabled={analyzing}
                            className="group relative px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity" />
                            <div className="relative flex items-center gap-3">
                              {analyzing ? (
                                <>
                                  <Loader2 className="w-6 h-6 animate-spin" /> 
                                  <span>Analyzing Documents...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-6 h-6" />
                                  <span>Generate Detailed Analysis</span>
                                </>
                              )}
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Image Viewer Portal */}
      {selectedImage && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Toolbar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 pointer-events-auto z-50">
                <button 
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white text-sm font-medium w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button 
                  onClick={() => setZoom(1)}
                  className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-2 hover:bg-red-500/20 text-white hover:text-red-400 rounded-xl transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Container */}
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4 pointer-events-auto custom-scrollbar">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                  </div>
                )}
                <motion.img 
                  src={selectedImage} 
                  alt="Medical Report" 
                  onLoad={() => setImageLoading(false)}
                  animate={{ scale: zoom }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                  drag={zoom > 1}
                  dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                />
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Report"
        message={`Are you sure you want to delete "${reportToDelete?.folderName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Deleting Loader */}
      {deleting && <Loader text="Deleting Report..." fullScreen={true} />}
      
      {/* Uploading Loader */}
      {uploading && <Loader text="Uploading Files..." fullScreen={true} />}
    </div>
  );
};

export default MedicalReports;
