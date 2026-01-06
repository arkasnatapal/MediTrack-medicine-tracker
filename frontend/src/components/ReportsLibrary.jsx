import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Image as ImageIcon, Search, Download, Eye, Calendar, Clock, ArrowRight } from 'lucide-react';
import ReportViewerModal from './ReportViewerModal';

const ReportsLibrary = ({ memberId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null); // For Modal
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      let url = `${API_URL}/reports`;
      let headers = { Authorization: `Bearer ${token}` };

      // If memberId is provided (Public Profile), use public endpoint
      if (memberId) {
        url = `${API_URL}/reports/public/${memberId}`;
        // Public endpoint might not need auth, or we might need to handle it differenty.
        // For now, assuming it's open if we have memberId, or uses same token if available (though doctor token is different).
        // Since it's public profile specific, we might not send auth header if not logged in, but here "doctor" is viewing so maybe not logged in as patient.
        // The backend route defined above does NOT use 'protect' middleware for '/public/:memberId'.
        // So we can omit Authorization header if it causes issues, or keep it if it ignores it.
        // To be safe and since I didn't add 'protect' in route:
        headers = {};
      }

      const res = await axios.get(url, { headers });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      console.error("Error fetching reports", err);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [memberId]);

  const filteredReports = reports.filter(r => 
    (r.folderName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     r.domain?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFileIcon = (report) => {
    const type = report.files?.[0]?.fileType || 'unknown';
    if (type === 'pdf') return <FileText className="w-6 h-6 text-rose-500" />;
    return <ImageIcon className="w-6 h-6 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Medical Reports Library
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
             Access your uploaded medical documents and analysis.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search reports..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
           />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map(i => (
             <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
           ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredReports.map(report => (
             <div 
               key={report._id} 
               className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
             >
                <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                     {getFileIcon(report)}
                   </div>
                   <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                     {(report.domain || 'General').toUpperCase()}
                   </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate pr-2" title={report.folderName}>
                  {report.folderName}
                </h4>
                
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.reportDate).toLocaleDateString()}
                  </span>
                  {report.files?.length > 0 && (
                     <span>• {report.files[0].fileType?.toUpperCase()}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <button 
                     onClick={() => setSelectedReport(report)}
                     className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                   >
                     <Eye className="w-4 h-4" /> View
                   </button>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
           <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <p className="text-slate-500 dark:text-slate-400 font-medium">No reports found.</p>
           {searchQuery && <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>}
        </div>
      )}

      {/* Viewer Modal */}
      <ReportViewerModal 
        isOpen={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};

export default ReportsLibrary;
