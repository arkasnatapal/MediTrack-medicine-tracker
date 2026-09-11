import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, FileText, Download, User, Calendar, Building2, Stethoscope, RefreshCw, CheckCircle2, AlertCircle, Search, ExternalLink, ChevronDown, ChevronUp, Trash2, AlertTriangle, X, ShoppingCart, ShoppingBag } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, DIGITAL, OFFLINE
  const [expandedCards, setExpandedCards] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleBuyMedicines = (medList) => {
    if (!medList || medList.length === 0) return;
    const primaryName = medList[0].name || '';
    navigate('/care-network/medicines', {
      state: {
        searchQuery: primaryName,
        medicines: medList,
        isBatchBuy: medList.length > 1
      }
    });
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/prescriptions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.prescriptions) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openPdfDocument = (pdfDataUrl) => {
    if (!pdfDataUrl) {
      return alert('PDF document URL not available for this offline hardcopy record.');
    }
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${pdfDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      alert('Please allow popups to view the PDF prescription.');
    }
  };

  const promptDelete = (p, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(p);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const targetId = deleteTarget._id || deleteTarget.appointmentId;
      await axios.delete(`${API_BASE}/care-network/prescriptions/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPrescriptions(prev => prev.filter(p => (p._id || p.appointmentId) !== targetId));
      setToastMessage('Prescription record deleted successfully.');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.error('Error deleting prescription:', err);
      alert('Failed to delete prescription. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch =
      (p.facilityName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'DIGITAL') return matchesSearch && !p.isOfflinePrescription;
    if (filterType === 'OFFLINE') return matchesSearch && p.isOfflinePrescription;
    return matchesSearch;
  });

  const digitalCount = prescriptions.filter(p => !p.isOfflinePrescription).length;
  const offlineCount = prescriptions.filter(p => p.isOfflinePrescription).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-8 space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-slate-50/90 dark:from-teal-900 dark:via-slate-900 dark:to-emerald-950 p-4 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-xl border border-emerald-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-teal-500/20 text-emerald-800 dark:text-teal-300 text-xs font-black uppercase tracking-wider border border-emerald-300/60 dark:border-teal-500/30">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-teal-400" />
              <span>Medical OPD Records Hub</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">MY PRESCRIPTIONS & CLINICAL DOCUMENTS</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Access, view, download, and manage your digital PDF prescriptions and offline handwritten records.
            </p>
          </div>

          <button
            onClick={fetchPrescriptions}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 dark:border-slate-700 shadow-md transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Records</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-emerald-200/80 dark:border-white/10 backdrop-blur-md shadow-sm overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase leading-tight block break-words">
              <span className="sm:hidden">Total Rx</span>
              <span className="hidden sm:inline">Total Prescriptions</span>
            </span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{prescriptions.length}</div>
          </div>
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-emerald-200/80 dark:border-white/10 backdrop-blur-md shadow-sm overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-teal-800 dark:text-teal-300 font-black uppercase leading-tight block break-words">
              <span className="sm:hidden">Digital PDF</span>
              <span className="hidden sm:inline">Digital PDF Copies</span>
            </span>
            <div className="text-lg sm:text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">{digitalCount}</div>
          </div>
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-emerald-200/80 dark:border-white/10 backdrop-blur-md shadow-sm overflow-hidden">
            <span className="text-[9px] sm:text-[10px] text-amber-800 dark:text-amber-300 font-black uppercase leading-tight block break-words">
              <span className="sm:hidden">Offline Paper</span>
              <span className="hidden sm:inline">Offline Handwritten</span>
            </span>
            <div className="text-lg sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{offlineCount}</div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search doctor, hospital, diagnosis..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold w-full sm:w-auto sm:flex">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-1.5 sm:px-3 py-1.5 rounded-lg transition text-center truncate ${filterType === 'ALL' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All ({prescriptions.length})
          </button>
          <button
            onClick={() => setFilterType('DIGITAL')}
            className={`px-1.5 sm:px-3 py-1.5 rounded-lg transition text-center truncate ${filterType === 'DIGITAL' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <span className="sm:hidden">Digital ({digitalCount})</span>
            <span className="hidden sm:inline">Digital PDF ({digitalCount})</span>
          </button>
          <button
            onClick={() => setFilterType('OFFLINE')}
            className={`px-1.5 sm:px-3 py-1.5 rounded-lg transition text-center truncate ${filterType === 'OFFLINE' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <span className="sm:hidden">Offline ({offlineCount})</span>
            <span className="hidden sm:inline">Offline Hardcopy ({offlineCount})</span>
          </button>
        </div>
      </div>

      {/* Prescription Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500 mb-2" />
          <p className="font-bold">Loading prescriptions...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <Pill className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No Prescriptions Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'No records match your search query.' : 'Prescriptions issued by doctors during your OPD consultations will automatically appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrescriptions.map((p, idx) => {
            const cardId = p._id || `rx-${idx}`;
            const isExpanded = !!expandedCards[cardId];
            const medCount = p.medicines ? p.medicines.length : 0;

            return (
              <div
                key={cardId}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden transition-all duration-200 hover:border-teal-500/50"
              >
                {/* Compact Header Bar (Always visible) */}
                <div
                  onClick={() => toggleExpand(cardId)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-700/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {p.facilityName}
                        </h3>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${p.isOfflinePrescription ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'}`}>
                          {p.isOfflinePrescription ? '📋 Offline Hardcopy' : '📄 Digital PDF'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 flex-wrap font-medium">
                        <span className="font-bold text-teal-700 dark:text-teal-400">
                          Dr. {p.doctorName || 'Specialist'} {p.doctorSpecialization && `(${p.doctorSpecialization})`}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{p.date}</span>
                        {p.diagnosis && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-900 px-2.5 py-0.5 rounded-md truncate max-w-[180px]">
                              {p.diagnosis}
                            </span>
                          </>
                        )}
                        {medCount > 0 && (
                          <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                            ({medCount} {medCount === 1 ? 'medicine' : 'medicines'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: PDF, Delete, and Dropdown Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                    {p.pdfDataUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPdfDocument(p.pdfDataUrl);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </button>
                    )}

                    {/* Delete Icon Button */}
                    <button
                      onClick={(e) => promptDelete(p, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete Prescription Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 text-xs font-bold hover:text-teal-500 dark:hover:text-teal-400 transition">
                      <span className="text-[11px]">{isExpanded ? 'Less' : 'Details'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-teal-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed View */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-700/50 gap-1">
                      <div>Department: <strong className="text-slate-800 dark:text-white">{p.department || 'General OPD'}</strong></div>
                      <div>Token Number: <strong className="text-amber-600 dark:text-amber-400">#{p.tokenNumber || 1}</strong></div>
                    </div>

                    {/* Full Diagnosis */}
                    {p.diagnosis && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                        <span className="font-extrabold text-slate-400 uppercase text-[10px] block mb-0.5">Clinical Diagnosis</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{p.diagnosis}</span>
                      </div>
                    )}

                    {/* Prescribed Medicines Section */}
                    {p.medicines && p.medicines.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-400 uppercase text-[10px] sm:text-xs">
                            Prescribed Medicines ({p.medicines.length})
                          </span>
                          {p.medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleBuyMedicines(p.medicines)}
                              className="px-3 py-1.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                              title="Buy all prescribed medicines from MediTrack Pharmacy / Stock page"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Buy All ({p.medicines.length})</span>
                            </button>
                          )}
                        </div>

                        {/* MOBILE CARDS VIEW (phones < 640px) */}
                        <div className="block sm:hidden space-y-2.5">
                          {p.medicines.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 space-y-2 shadow-xs"
                            >
                              {/* Top Bar: Number, Name, Buy Button */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                                    #{mIdx + 1}
                                  </span>
                                  <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                                    {m.name || 'Medicine'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleBuyMedicines([m])}
                                  className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer flex-shrink-0"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>Buy</span>
                                </button>
                              </div>

                              {/* Badges: Frequency & Duration */}
                              <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                                {m.frequency && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-teal-100/90 text-teal-900 dark:bg-teal-950 dark:text-teal-300 text-[11px] font-bold">
                                    Freq: {m.frequency}
                                  </span>
                                )}
                                {m.duration && (
                                  <span className="px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px]">
                                    Duration: {m.duration}
                                  </span>
                                )}
                              </div>

                              {/* Dosage / Instructions Box */}
                              {m.dosage && (
                                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80 space-y-0.5">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">Dosage / Instructions</span>
                                  <p className="font-medium text-[11px] leading-snug">{m.dosage}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* DESKTOP TABLE VIEW (screens >= 640px) */}
                        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-3">#</th>
                                <th className="p-3">Medicine Name</th>
                                <th className="p-3">Dosage</th>
                                <th className="p-3">Frequency</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {p.medicines.map((m, mIdx) => (
                                <tr key={mIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                  <td className="p-3 font-bold text-slate-400">{mIdx + 1}</td>
                                  <td className="p-3 font-black text-slate-900 dark:text-white">{m.name || 'Medicine'}</td>
                                  <td className="p-3 font-medium max-w-xs leading-relaxed">{m.dosage || '-'}</td>
                                  <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{m.frequency || '-'}</td>
                                  <td className="p-3 font-medium">{m.duration || '-'}</td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleBuyMedicines([m])}
                                      className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 font-extrabold text-xs border border-teal-200 dark:border-teal-800/60 inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                      title={`Buy / Order ${m.name}`}
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                      <span>Buy</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Doctor Advice */}
                    {p.advice && (
                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-950 dark:text-teal-200">
                        <span className="font-extrabold text-teal-700 dark:text-teal-400 uppercase text-[10px] block mb-0.5">Doctor Clinical Advice</span>
                        <p className="italic font-medium">"{p.advice}"</p>
                      </div>
                    )}

                    {/* Detailed Footer */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400 font-medium">
                      <span>
                        {p.isOfflinePrescription ? '📋 Offline paper prescription issued at hospital' : '✅ Verified electronic prescription PDF ready'}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => promptDelete(p, e)}
                          className="text-red-500 hover:text-red-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Record
                        </button>
                        {p.pdfDataUrl && (
                          <button
                            onClick={() => openPdfDocument(p.pdfDataUrl)}
                            className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                          >
                            Open Full Screen PDF →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Delete Confirmation Modal Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 transform scale-100 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Prescription?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Are you sure you want to delete the prescription from <strong className="text-slate-800 dark:text-slate-200">{deleteTarget.facilityName}</strong> issued on <strong className="text-slate-800 dark:text-slate-200">{deleteTarget.date}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {deleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;
