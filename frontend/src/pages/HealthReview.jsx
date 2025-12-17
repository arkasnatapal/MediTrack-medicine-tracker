import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, FileText, Download, Share2, AlertCircle, 
  CheckCircle, TrendingUp, Heart, Brain, Utensils,
  Calendar, Shield, AlertTriangle, Clock, Plus, ChevronRight, ArrowLeft, Pill, Trash2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, Legend,
  LineChart, Line
} from 'recharts';
import api from '../api/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const HealthReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState('loading'); // 'loading', 'list', 'detail'
  const [error, setError] = useState(null);
  const reportRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (user?.avatar) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      // Add cache buster to avoid browser caching the image without CORS headers
      img.src = user.avatar.startsWith('data:') ? user.avatar : `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          setProfileImage(canvas.toDataURL('image/png'));
        } catch (e) {
          console.warn("Could not convert image to base64 (likely tainted)", e);
          setProfileImage(user.avatar);
        }
      };
      
      img.onerror = () => {
        console.warn("Failed to load profile image for PDF generation");
        setProfileImage(user.avatar);
      };
    }
  }, [user?.avatar]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/health-reports');
      if (res.data.success) {
        setHistory(res.data.reports);
        if (res.data.reports.length === 0) {
          // New User -> Auto Generate
          generateNewReport();
        } else {
          setViewMode('list');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history.");
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    setGenerating(true);
    setViewMode('detail'); // Show loading state in detail view
    setError(null);
    try {
      const res = await api.post('/ai/health-review');
      if (res.data.success) {
        setData(res.data.data);
        // Refresh history in background
        const histRes = await api.get('/ai/health-reports');
        if (histRes.data.success) setHistory(histRes.data.reports);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate health thesis. Please try again.");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const viewReport = async (id) => {
    setLoading(true);
    setViewMode('detail');
    try {
      const res = await api.get(`/ai/health-reports/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching report details:", err);
      setError("Failed to load report details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (e, id) => {
    e.stopPropagation(); // Prevent triggering viewReport
    if (!window.confirm("Are you sure you want to delete this health report?")) return;

    try {
      const res = await api.delete(`/ai/health-reports/${id}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(report => report._id !== id));
      }
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      // Show some feedback? Maybe not needed if fast, but good practice.
      // Using existing loading state might flicker, so let's just do it.
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true, // Ensure external images (avatar) are captured
        backgroundColor: '#0f172a', // Dark background for PDF
        logging: false,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfImgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;
      
      // Subsequent pages
      while (heightLeft > 0) {
        position -= pdfHeight; // Move the image up by one page height
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`MediTrack_Health_Report_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  // --- Loading State ---
  if (loading || generating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-t-4 border-cyan-500 rounded-full animate-spin reverse"></div>
            <Brain className="absolute inset-0 m-auto h-8 w-8 text-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {generating ? "AI is Analyzing Your Health..." : "Loading..."}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {generating ? "Consulting medical models for your thesis" : "Fetching your data"}
          </p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // --- History List View ---
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="h-8 w-8 text-emerald-500" />
                Health Reports
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Your AI-generated health history
              </p>
            </div>
            <button
              onClick={generateNewReport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              New Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all group cursor-pointer"
                onClick={() => viewReport(report._id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {report.healthScore}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase block">Score</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {new Date(report.createdAt).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                  {report.summary}
                </p>
                
                <div className="flex items-center  text-emerald-500 justify-between font-bold text-sm  transition-transform">
                  <span className="flex  hover:text-green-400 items-center">
                    View Full Analysis <ChevronRight className="h-4 w-4 ml-1" />
                  </span>
                  <button 
                    onClick={(e) => handleDeleteReport(e, report._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all transform hover:scale-110"
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Detail View (Existing Report UI) ---
  const medicineData = data?.medicineAnalysis?.map(m => ({
    name: m.category,
    value: m.count
  })) || [];

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Activity className="h-8 w-8 text-emerald-500" />
                Health Thesis
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                AI-Powered Comprehensive Health Analysis
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline dark:text-slate-900 text-white">Download Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8" ref={reportRef}>
        
        {/* Report Header (Visible in PDF) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500 p-2 rounded-xl">
                <Pill className="h-8 w-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">MEDITRACK</h2>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Health Intelligence</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    Generated: {new Date().toLocaleString()}
                  </p>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{user?.name || 'GUEST USER'}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user?.email}</p>
             </div>
             <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-lg">
                <UserAvatar 
                        user={user} 
                        className="h-full w-full" 
                        fallbackType="icon"
                      />
             </div>
          </div>
        </div>
        
        {/* Executive Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-emerald-500/20"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 grid md:grid-cols-3 gap-8 md:gap-12 items-center">
            <div className="md:col-span-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-sm font-medium">
                <Brain className="h-4 w-4" />
                AI Generated Analysis
              </div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Your Health Score is <span className="text-emerald-300">{data?.healthScore}/100</span>
              </h2>
              <p className="text-lg md:text-xl text-emerald-100 leading-relaxed max-w-2xl">
                {data?.summary}
              </p>
            </div>
            
            {/* Radial Chart for Score */}
            <div className="flex justify-center md:justify-end">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    innerRadius="80%" 
                    outerRadius="100%" 
                    barSize={20} 
                    data={[{ name: 'Score', value: data?.healthScore, fill: '#ffffff' }]} 
                    startAngle={90} 
                    endAngle={-270}
                  >
                    <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-black">{data?.healthScore}</span>
                  <span className="text-sm uppercase tracking-widest opacity-80">Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Medicine Composition */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Medicine Portfolio
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {medicineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Symptoms & Risks */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="grid md:grid-cols-2 gap-8 h-full">
              {/* Symptoms */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Probable Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data?.symptomsAnalysis?.probableSymptoms.map((sym, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-bold border border-amber-100 dark:border-amber-900/30">
                      {sym}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  {data?.symptomsAnalysis?.explanation}
                </p>
              </div>

              {/* Disease Risk */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-rose-500" />
                  Health Risks & Prevention
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mb-1">Managing</span>
                    <div className="flex flex-wrap gap-2">
                      {data?.diseaseRisk?.ongoing.map((item, i) => (
                        <span key={i} className="font-bold text-slate-900 dark:text-white">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">Preventing</span>
                    <div className="flex flex-wrap gap-2">
                      {data?.diseaseRisk?.prevention.map((item, i) => (
                        <span key={i} className="font-bold text-slate-900 dark:text-white">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Nutrition & Diet */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-[2rem] p-6 md:p-8 border border-orange-100 dark:border-orange-900/30"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-orange-500" />
            Nutritional Recommendations
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {data?.dietaryAdvice?.map((advice, i) => (
              <div key={i} className="flex gap-4 items-start bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400 font-bold">
                  {i + 1}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {advice}
                </p>
              </div>
            ))}
          </div>

          {/* Nutrition Trends Chart */}
          {data?.nutritionTrends && (
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Weekly Nutrient Trends
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.nutritionTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="protein" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} name="Protein (g)" />
                    <Line type="monotone" dataKey="carbs" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} name="Carbs (g)" />
                    <Line type="monotone" dataKey="fats" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} name="Fats (g)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>

        {/* Monthly Report */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-500" />
              {data?.monthlyReport?.month} Report
            </h3>
            <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Monthly Insights
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Key Insights
              </h4>
              <ul className="space-y-3">
                {data?.monthlyReport?.insights.map((insight, i) => (
                  <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-500" />
                Action Items
              </h4>
              <ul className="space-y-3">
                {data?.monthlyReport?.actionItems.map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-600 text-sm font-medium">
            <Shield className="h-4 w-4" />
            Verified by MediTrack AI • Medical Disclaimer Applies
          </div>
        </div>

      </div>
    </div>
  );
};

export default HealthReview;
