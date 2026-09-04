import React, { useState } from 'react';
import { X, Code2, ShieldCheck, Copy, Check, FileText, Activity, Database, Sparkles, Layers, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AbdmFhirInspectorModal = ({ isOpen, onClose, consent, fhirData }) => {
  const [activeTab, setActiveTab] = useState('VISUAL'); // 'VISUAL' or 'RAW_JSON'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !consent) return null;

  const bundle = fhirData?.fhirBundle || {};
  const entries = bundle.entry || [];
  const jsonString = JSON.stringify(bundle, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">HL7 FHIR R4 Bundle Inspector</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> ABDM Interoperable
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Standardized Health Record Envelope requested by <span className="font-bold text-slate-200">{consent.requesterName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader & Tabs */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Bundle ID: <strong className="text-cyan-300">{bundle.identifier?.value || 'IN-ABDM-FHIR-820194'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] hidden sm:flex">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profile: <strong className="text-slate-300">ABDM DocumentBundle R4</strong></span>
              </div>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setActiveTab('VISUAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'VISUAL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Visual Breakdown
              </button>
              <button
                onClick={() => setActiveTab('RAW_JSON')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'RAW_JSON'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Raw FHIR JSON
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'VISUAL' ? (
              <div className="space-y-6">
                {/* Envelope Status Banner */}
                <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 p-4 rounded-2xl border border-blue-800/40 flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      ABDM Certified Digital Health Record Bundle
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                        Signed & Verified
                      </span>
                    </div>
                    <p className="text-slate-300">
                      This payload adheres to <strong>HL7 FHIR Release 4</strong> specifications and Indian <strong>NRCES / ABDM</strong> guidelines. It enables seamless cross-hospital clinical data portability.
                    </p>
                  </div>
                </div>

                {/* FHIR Resources List */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Extracted FHIR Resources ({entries.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {entries.map((entry, idx) => {
                      const res = entry.resource || {};
                      return (
                        <div
                          key={res.id || idx}
                          className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 hover:border-blue-500/40 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30 uppercase">
                                {res.resourceType}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">ID: #{res.id}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {res.status ? `Status: ${res.status.toUpperCase()}` : 'Valid'}
                            </span>
                          </div>

                          {/* Specific resource views */}
                          {res.resourceType === 'Composition' && (
                            <div className="text-xs space-y-1.5 text-slate-300">
                              <div><strong className="text-slate-100">Title:</strong> {res.title}</div>
                              <div><strong className="text-slate-100">LOINC Code:</strong> <span className="font-mono text-cyan-300">{res.type?.coding?.[0]?.code}</span> ({res.type?.coding?.[0]?.display})</div>
                              <div><strong className="text-slate-100">Author:</strong> {res.author?.[0]?.display}</div>
                            </div>
                          )}

                          {res.resourceType === 'Patient' && (
                            <div className="text-xs space-y-1.5 text-slate-300">
                              <div><strong className="text-slate-100">Full Name:</strong> {res.name?.[0]?.text}</div>
                              <div className="flex flex-wrap gap-2">
                                <span><strong>ABHA Number:</strong> <span className="font-mono text-amber-300">{res.identifier?.[0]?.value}</span></span>
                                <span>•</span>
                                <span><strong>ABHA Address:</strong> <span className="font-mono text-cyan-300">{res.identifier?.[1]?.value}</span></span>
                              </div>
                            </div>
                          )}

                          {res.resourceType === 'MedicationRequest' && (
                            <div className="text-xs space-y-1.5 text-slate-300">
                              <div><strong className="text-slate-100">Medication (SNOMED CT):</strong> <span className="font-semibold text-emerald-300">{res.medicationCodeableConcept?.text}</span> <span className="font-mono text-slate-400">({res.medicationCodeableConcept?.coding?.[0]?.code})</span></div>
                              <div><strong className="text-slate-100">Dosage Instruction:</strong> <span className="text-slate-200">{res.dosageInstruction?.[0]?.text}</span></div>
                            </div>
                          )}

                          {res.resourceType === 'Condition' && (
                            <div className="text-xs space-y-1.5 text-slate-300">
                              <div><strong className="text-slate-100">Diagnosis / Symptom:</strong> <span className="font-semibold text-rose-300">{res.code?.text}</span> <span className="font-mono text-slate-400">({res.code?.coding?.[0]?.code})</span></div>
                              <div><strong className="text-slate-100">Verification:</strong> <span className="text-emerald-400 uppercase font-mono text-[10px]">{res.verificationStatus?.coding?.[0]?.code}</span></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Syntax: HL7 FHIR Release 4 JSON</span>
                  <button
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy FHIR JSON'}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-[50vh]">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                    {jsonString}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live FHIR Stream Ready
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AbdmFhirInspectorModal;
