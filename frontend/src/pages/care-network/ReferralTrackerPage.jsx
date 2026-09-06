import React, { useState, useEffect } from 'react';
import { GitMerge, Building2, CheckCircle2, Clock, ArrowRight, ShieldAlert, Activity, User, FileText, Trash2, History, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ReferralTrackerPage = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/referrals/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && Array.isArray(res.data.referrals)) {
        setReferrals(res.data.referrals);
      } else {
        setReferrals([]);
      }
    } catch (err) {
      console.error('Failed to fetch patient referrals:', err);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReferral = async (id) => {
    if (!window.confirm('Are you sure you want to delete this referral record permanently?')) {
      return;
    }
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/care-network/referrals/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setReferrals(prev => prev.filter(r => (r._id !== id && r.referralId !== id)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete referral record');
    } finally {
      setDeletingId(null);
    }
  };

  const activeReferrals = referrals.filter(r => r.status !== 'COMPLETED');
  const completedReferrals = referrals.filter(r => r.status === 'COMPLETED');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-cyan-50/90 via-teal-50/90 to-blue-50/90 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border border-cyan-200/80 dark:border-slate-700 shadow-md p-6 sm:p-8 rounded-3xl space-y-4 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border border-cyan-300/60 dark:border-transparent text-xs font-black uppercase">
              <GitMerge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Multi-Tier Public Referral Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              PATIENT REFERRAL TRACKING
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Track your healthcare continuity journey across Sub-Centers, PHCs, CHCs, Rural Hospitals, and District Hospitals.
            </p>
          </div>

          {/* HISTORY BUTTON WITH COUNTER BADGE */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-cyan-300 dark:border-slate-700 font-extrabold text-xs flex items-center gap-2.5 shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Referral History</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
              {completedReferrals.length} Completed
            </span>
          </button>
        </div>
      </div>

      {/* ACTIVE REFERRAL CARDS LIST */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-3">Fetching authentic patient referral records...</p>
        </div>
      ) : activeReferrals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <GitMerge className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Patient Referrals</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You have no pending or active referrals. All completed referrals have been archived in your <strong className="text-cyan-600 dark:text-cyan-400">Referral History</strong>.
          </p>

          {completedReferrals.length > 0 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-4 py-2 bg-cyan-600 text-white font-bold text-xs rounded-xl shadow hover:bg-cyan-500 transition inline-flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>View Completed Referral History ({completedReferrals.length})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activeReferrals.map(ref => (
            <div
              key={ref.referralId || ref._id}
              className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 uppercase">
                      {ref.priority || 'ROUTINE'} PRIORITY REFERRAL
                    </span>
                    {ref.isInterState && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 uppercase">
                        ⚠️ Inter-State Transfer
                      </span>
                    )}
                    {ref.patientFamilyConsent?.consentGiven && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 uppercase">
                        ✓ Family Consent Obtained
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60">
                      🆔 Referral ID: {ref.referralId || `REF-${ref._id?.toString()?.slice(-6)?.toUpperCase() || ref._id}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    ref.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    ref.status === 'ADVICE_PROVIDED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}>
                    STATUS: {ref.status}
                  </span>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDeleteReferral(ref._id)}
                    disabled={deletingId === ref._id}
                    title="Delete Referral Record"
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition flex items-center justify-center active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VISUAL TRANSIT FLOW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Referring Origin</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{ref.fromFacilityName}</p>
                  {ref.referringDoctorName && (
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{ref.referringDoctorName}</p>
                  )}
                  <span className="text-[10px] font-semibold text-emerald-600 block pt-0.5">✓ Encounter & Vitals Verified</span>
                </div>

                <div className="flex items-center justify-center py-2 md:py-0">
                  <div className="flex flex-col items-center gap-1 text-blue-600 font-extrabold text-xs">
                    <span className="uppercase text-[10px] tracking-wider text-slate-400">{ref.department || 'General Medicine'}</span>
                    <div className="flex items-center gap-1.5">
                      <span>TRANSFERRING</span>
                      <ArrowRight className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Destination Facility</span>
                  <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{ref.toFacilityName}</p>
                  {ref.targetDoctorName && (
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Specialist: {ref.targetDoctorName}</p>
                  )}
                  <span className="text-[10px] font-semibold text-amber-600 block pt-0.5">⌛ Priority Intake Prepared</span>
                </div>
              </div>

              {/* CLINICAL REASON & SPECIALIST ADVICE */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Clinical Referral Reason</h4>
                  <p className="p-3.5 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-700 dark:text-slate-300 font-medium">
                    {ref.reason}
                    {ref.clinicalNotes && <span className="block mt-1 text-slate-500 dark:text-slate-400 text-[11px]">Notes: {ref.clinicalNotes}</span>}
                  </p>
                </div>

                {ref.consultationAdvice && ref.consultationAdvice.adviceNotes && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 rounded-2xl space-y-1">
                    <span className="font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 uppercase text-[10px]">
                      <FileText className="w-3.5 h-3.5" /> Specialist Advice & Treatment Protocol
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{ref.consultationAdvice.adviceNotes}</p>
                    {ref.consultationAdvice.recommendedTreatment && (
                      <p className="text-teal-600 dark:text-teal-400 font-medium text-[11px]">
                        Recommended Protocol: {ref.consultationAdvice.recommendedTreatment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLETED REFERRALS HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-cyan-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto space-y-6">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    COMPLETED REFERRAL HISTORY ({completedReferrals.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Archived clinical referrals confirmed and completed by attending specialist doctors.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY LIST */}
            {completedReferrals.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Completed Referrals in History Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When your attending doctor completes and signs off on an active referral, it will automatically appear in this history log.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {completedReferrals.map(ref => (
                  <div
                    key={ref.referralId || ref._id}
                    className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/60 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 dark:border-slate-800 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          🆔 Referral ID: {ref.referralId || `REF-${ref._id?.toString()?.slice(-6)?.toUpperCase() || ref._id}`}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>REFERRAL COMPLETED BY DOCTOR</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ref.completedAt && (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Completed: {ref.completedAt}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteReferral(ref._id)}
                          title="Delete Historical Record"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Referring Origin</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{ref.fromFacilityName}</p>
                        <p className="text-cyan-600 font-medium text-[11px]">Doctor: {ref.referringDoctorName}</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination Facility</span>
                        <p className="font-bold text-blue-600 dark:text-blue-400">{ref.toFacilityName}</p>
                        <p className="text-teal-600 font-medium text-[11px]">Specialist: {ref.targetDoctorName || 'Department Officer'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] block">Clinical Reason:</span>
                        <p className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 font-medium">
                          {ref.reason}
                        </p>
                      </div>

                      {ref.completionNotes && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-slate-800 dark:text-emerald-200 font-semibold space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Doctor Completion & Discharge Summary:</span>
                          <p>{ref.completionNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl shadow"
              >
                Close History Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralTrackerPage;
