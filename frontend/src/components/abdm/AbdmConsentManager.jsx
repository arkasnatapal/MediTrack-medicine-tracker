import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, XCircle, Clock, FileText, AlertCircle, RefreshCw, ChevronRight, Building2, User, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AbdmConsentManager = ({ consents, onRespondConsent, onInspectFhir }) => {
  const [loadingId, setLoadingId] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, GRANTED, DENIED

  const filteredConsents = consents.filter(c => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const handleAction = async (consentId, action) => {
    setLoadingId(consentId);
    try {
      await onRespondConsent(consentId, action);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GRANTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACCESS GRANTED
          </span>
        );
      case 'DENIED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-400" /> ACCESS DENIED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" /> PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              ABDM Health Consent Manager
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Privacy Gateway
              </span>
            </h3>
            <p className="text-xs text-slate-400">Control which hospitals & doctors can access your digital health history</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs self-start">
          {['ALL', 'PENDING', 'GRANTED', 'DENIED'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Consent Cards List */}
      {filteredConsents.length === 0 ? (
        <div className="text-center py-10 text-slate-400 space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-medium">No consent requests found for filter: <span className="font-bold text-slate-300">{filter}</span></p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsents.map((consent) => (
            <motion.div
              key={consent._id || consent.requestId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 hover:border-slate-600 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-sm md:text-base">{consent.requesterName}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-amber-300/80">{consent.requestId}</span>
                    <span>•</span>
                    <span>Requested: {new Date(consent.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  {getStatusBadge(consent.status)}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Purpose of Request</div>
                  <div className="text-slate-200 font-medium">{consent.purpose}</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">Requested Health Record Types</div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {consent.healthRecordTypes.map(type => (
                      <span key={type} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-mono border border-blue-800/50">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expiry & Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Valid Till: <strong className="text-slate-200">{new Date(consent.validTill).toLocaleDateString()}</strong></span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {consent.status === 'GRANTED' && (
                    <button
                      onClick={() => onInspectFhir && onInspectFhir(consent)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      Inspect HL7 FHIR Bundle
                    </button>
                  )}

                  {consent.status === 'PENDING' && (
                    <>
                      <button
                        disabled={loadingId === consent._id}
                        onClick={() => handleAction(consent._id, 'DENY')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        {loadingId === consent._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Deny Access
                      </button>
                      <button
                        disabled={loadingId === consent._id}
                        onClick={() => handleAction(consent._id, 'GRANT')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
                      >
                        {loadingId === consent._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Grant Access
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};


export default AbdmConsentManager;
