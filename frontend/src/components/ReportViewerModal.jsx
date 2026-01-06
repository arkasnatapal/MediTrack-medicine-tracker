import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Download, ZoomIn, ZoomOut, AlertTriangle, FileText, ChevronLeft, ChevronRight, MoreVertical, Copy } from 'lucide-react';

const ReportViewerModal = ({ isOpen, onClose, report }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  
  // Download Menu State
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);

  // Reset state when report changes
  useEffect(() => {
    if (isOpen && report) {
      setCurrentFileIndex(0);
      setScale(1);
      setLoading(true);
      setError(false);
      setShowDownloadMenu(false);
    }
  }, [isOpen, report]);

  // Reset loading/error when file index changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    setScale(1);
    setImgDimensions({ w: 0, h: 0 });
  }, [currentFileIndex]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !report) return null;

  const files = report.files || [];
  const totalFiles = files.length;
  const currentFile = files[currentFileIndex];
  
  const isPdf = currentFile?.fileType === 'pdf' || currentFile?.url?.toLowerCase().endsWith('.pdf');
  const fileUrl = currentFile?.url;

  const downloadFile = async (file, index) => {
    if (!file?.url) return;
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.originalName || `report-${report._id}-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = file.url;
      link.target = '_blank';
      link.download = file.originalName || `report-${report._id}-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadCurrent = () => {
    downloadFile(currentFile, currentFileIndex);
    setShowDownloadMenu(false);
  };

  const handleDownloadAll = async () => {
    setShowDownloadMenu(false);
    // Sequential download to avoid browser throttling
    for (let i = 0; i < files.length; i++) {
      downloadFile(files[i], i);
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  };

  const handleNext = () => {
    if (currentFileIndex < totalFiles - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };

  const onImgLoad = (e) => {
    setLoading(false);
    setImgDimensions({
      w: e.target.naturalWidth,
      h: e.target.naturalHeight
    });
  };

  const renderImageStyle = () => {
    if (scale === 1 || imgDimensions.w === 0) {
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      };
    } else {
      return {
        height: `${100 * scale}%`,
        width: 'auto',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative bg-[#0F172A] w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900 z-50">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
               <FileText className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white truncate max-w-md">
                 {report.folderName || report.originalName || "Document Viewer"}
               </h3>
               <p className="text-xs text-slate-400">
                 {new Date(report.reportDate || report.createdAt).toLocaleDateString()} • File {currentFileIndex + 1} of {totalFiles}
               </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Download Dropdown */}
             <div className="relative" ref={downloadMenuRef}>
               <button 
                 onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                 className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                 title="Download Options"
               >
                 <Download className="w-5 h-5" />
                 <span className="hidden sm:inline text-sm font-medium">Download</span>
               </button>

               {showDownloadMenu && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-[70]">
                    <button 
                      onClick={handleDownloadCurrent}
                      className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Download Current
                    </button>
                    {totalFiles > 1 && (
                      <button 
                        onClick={handleDownloadAll}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 border-t border-slate-700"
                      >
                        <Copy className="w-4 h-4" /> Download All ({totalFiles})
                      </button>
                    )}
                 </div>
               )}
             </div>

             <button 
               onClick={onClose}
               className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col group">
           
           {/* Navigation Buttons */}
           {totalFiles > 1 && (
             <>
               <button 
                 onClick={handlePrev}
                 disabled={currentFileIndex === 0}
                 className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none shadow-lg"
               >
                 <ChevronLeft className="w-8 h-8" />
               </button>
               <button 
                 onClick={handleNext}
                 disabled={currentFileIndex === totalFiles - 1}
                 className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-sm transition-all disabled:opacity-0 disabled:pointer-events-none shadow-lg"
               >
                 <ChevronRight className="w-8 h-8" />
               </button>
             </>
           )}

           <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-8">
             {!fileUrl ? (
               <div className="text-center text-slate-400">
                 <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                 <p>File URL missing.</p>
               </div>
             ) : isPdf ? (
               <iframe 
                 src={`${fileUrl}#toolbar=0`} 
                 className="w-full h-full rounded-lg border border-slate-700 bg-white"
                 title={`PDF Viewer ${currentFileIndex + 1}`}
                 onLoad={() => setLoading(false)}
               />
             ) : (
                <img 
                  src={fileUrl} 
                  alt={`Report File ${currentFileIndex + 1}`}
                  className="bg-white shadow-2xl transition-all duration-200"
                  style={renderImageStyle()}
                  onLoad={onImgLoad}
                  onError={() => setError(true)}
                />
             )}
           </div>

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
               <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           )}
        </div>
        
        {/* Footer (Zoom & Thumbs) */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 z-50">
           {/* Thumbnails indicator */}
           <div className="flex items-center gap-2 overflow-x-auto max-w-md pb-2 md:pb-0 scrollbar-hide">
             {files.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFileIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${currentFileIndex === idx ? 'bg-indigo-500 w-8' : 'bg-slate-600 w-2 hover:bg-slate-500'}`}
                  title={f.originalName}
                />
             ))}
           </div>

           {/* Zoom Controls */}
           {!isPdf && (
            <div className="flex items-center gap-3 bg-slate-800 rounded-full p-1 border border-slate-700">
                <button 
                  onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xs font-mono font-bold text-slate-300">{Math.round(scale * 100)}%</span>
                <button 
                  onClick={() => setScale(s => Math.min(3, s + 0.25))}
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewerModal;
