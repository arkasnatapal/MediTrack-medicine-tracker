import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, FileText, Download, Share2, AlertCircle, 
  CheckCircle, TrendingUp, Heart, Brain, Utensils,
  Calendar, Shield, AlertTriangle, Clock, Plus, ChevronRight, ArrowLeft, Pill, Trash2,
  LayoutDashboard, Zap, Thermometer
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
          console.warn("Could not convert image to base64", e);
          setProfileImage(user.avatar);
        }
      };
      
      img.onerror = () => {
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
    setViewMode('detail');
    setError(null);
    try {
      const res = await api.post('/ai/health-review');
      if (res.data.success) {
        setData(res.data.data);
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
    e.stopPropagation();
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
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff', // Clean white background for PDF
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
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position -= pdfHeight;
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
            <Activity className="absolute inset-0 m-auto h-8 w-8 text-teal-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {generating ? "Analyzing Health Data..." : "Loading..."}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {generating ? "Generating your Vitality HUD" : "Please wait a moment"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analysis Failed</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm transition-transform active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- History List View ---
  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] p-6 lg:p-10 font-sans">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-900 dark:to-emerald-900 p-10 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium mb-3">
                  <Activity className="w-3 h-3" />
                  <span>Health Intelligence</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                  Health Review
                </h1>
                <p className="text-teal-50 text-lg max-w-xl">
                  Your AI-generated health history and vitality tracking.
                </p>
              </div>
              
              <button
                onClick={generateNewReport}
                className="group relative px-6 py-3 bg-white text-teal-700 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span className="dark:text-black">New Analysis</span>
              </button>
            </div>
          </div>

          {/* History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer flex flex-col"
                onClick={() => viewReport(report._id)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {report.healthScore}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {new Date(report.createdAt).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </h3>
                <div className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                  {report.summary}
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details <ChevronRight className="h-4 w-4" />
                  </span>
                  <button 
                    onClick={(e) => handleDeleteReport(e, report._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
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

  // --- Detail View ---
  const medicineData = data?.medicineAnalysis?.map(m => ({
    name: m.category,
    value: m.count
  })) || [];

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] pb-20 font-sans">
      {/* Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-500" />
              Analysis Report
            </h1>
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline text-white dark:text-black">Download PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8" ref={reportRef}>
        
        {/* Report Header for PDF */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
             <div className="bg-teal-500 p-3 rounded-2xl">
                <Pill className="h-6 w-6 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">MEDITRACK</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Health Intelligence Unit</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.name || 'Guest User'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString()}</p>
             </div>
             <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <UserAvatar user={user} className="h-full w-full" fallbackType="icon" />
             </div>
          </div>
        </div>
        
        {/* UNIQUE FEATURE: VITALITY HUD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Health Score Card */}
          <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Activity className="w-24 h-24 text-teal-500" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Vitality</span>
            <div className="relative mb-4">
              <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                {data?.healthScore}
              </span>
              <span className="absolute top-0 -right-6 text-xl text-teal-500 font-bold">+</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase">
              <CheckCircle className="w-3 h-3" />
              Health Status: Good
            </div>
          </div>

          {/* Key Metrics HUD */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Top Symptom */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                  <Thermometer className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Symptom</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {data?.symptomsAnalysis?.probableSymptoms[0] || "None Detected"}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {data?.symptomsAnalysis?.explanation || "No significant symptoms reported."}
                </p>
              </div>
            </div>

            {/* Top Risk */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attention Needed</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {data?.diseaseRisk?.ongoing[0] || "Prevention Focus"}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {data?.diseaseRisk?.prevention[0] || "Maintain current healthy habits."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            AI Executive Summary
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
            {data?.summary}
          </p>
        </div>

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Medicine Chart */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-500" />
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
          </div>

          {/* Nutrition & Diet */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-500" />
              Nutritional Plan
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {data?.dietaryAdvice?.map((advice, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400 font-bold text-xs">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {advice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Report Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              {data?.monthlyReport?.month} Report
            </h3>
            <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Monthly Insights
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Key Insights</h4>
              <ul className="space-y-3">
                {data?.monthlyReport?.insights.map((insight, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Action Items</h4>
              <ul className="space-y-3">
                {data?.monthlyReport?.actionItems.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">
            <Shield className="h-3 w-3" />
            Verified by MediTrack AI • Medical Disclaimer Applies
          </div>
        </div>

      </div>
    </div>
  );
};

export default HealthReview;
