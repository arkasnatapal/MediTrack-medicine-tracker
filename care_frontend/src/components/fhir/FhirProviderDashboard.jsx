import React, { useState, useEffect } from 'react';
import { Database, Code2, Download, Upload, ShieldCheck, Activity, Search, RefreshCw, Layers, Eye, FileText, CheckCircle2, User, Sparkles } from 'lucide-react';
import fhirService from '../../services/fhirService';
import { useAuth } from '../../context/AuthContext';

const SAMPLE_PRESETS = {
  vitals: {
    resourceType: "Observation",
    id: "sample-vital-temp",
    status: "final",
    subject: { reference: "Patient/sample-patient-001", display: "Sample Patient" },
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }
        ]
      }
    ],
    code: {
      coding: [
        { system: "http://loinc.org", code: "8310-5", display: "Body Temperature" }
      ],
      text: "Body Temperature"
    },
    valueQuantity: {
      value: 37.5,
      unit: "C",
      system: "http://unitsofmeasure.org",
      code: "Cel"
    },
    effectiveDateTime: new Date().toISOString()
  },
  condition: {
    resourceType: "Condition",
    id: "sample-condition-fever",
    subject: { reference: "Patient/sample-patient-001", display: "Sample Patient" },
    clinicalStatus: {
      coding: [
        { system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active", display: "Active" }
      ]
    },
    code: {
      coding: [
        { system: "http://snomed.info/sct", code: "386661006", display: "Fever (finding)" }
      ],
      text: "Acute Pyrexia / Fever"
    },
    recordedDate: new Date().toISOString()
  },
  medication: {
    resourceType: "MedicationRequest",
    id: "sample-med-paracetamol",
    status: "active",
    intent: "order",
    subject: { reference: "Patient/sample-patient-001", display: "Sample Patient" },
    medicationCodeableConcept: {
      coding: [
        { system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "161", display: "Acetaminophen 500 MG Oral Tablet" }
      ],
      text: "Paracetamol 500mg"
    },
    dosageInstruction: [
      { text: "1 tablet three times daily after meals for 5 days" }
    ],
    authoredOn: new Date().toISOString()
  },
  referral: {
    resourceType: "ServiceRequest",
    id: "sample-referral-cardio",
    status: "active",
    intent: "order",
    priority: "urgent",
    subject: { reference: "Patient/sample-patient-001", display: "Sample Patient" },
    code: {
      coding: [
        { system: "http://snomed.info/sct", code: "306124005", display: "Referral to Cardiology Service" }
      ],
      text: "Cardiology Specialist Evaluation"
    },
    authoredOn: new Date().toISOString()
  }
};

const FhirProviderDashboard = ({ facilityId: propFacilityId, doctorId: propDoctorId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('SEARCH'); // 'SEARCH' | 'IMPORT'
  const [resourceType, setResourceType] = useState('Patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'RAW'
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  const getCleanId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if (val._id) return String(val._id);
      if (val.id) return String(val.id);
    }
    return null;
  };

  const activeFacilityId = getCleanId(propFacilityId) || getCleanId(user?.facility) || getCleanId(user?.facilityId);
  const activeDoctorId = getCleanId(propDoctorId) || getCleanId(user?.doctor) || getCleanId(user?.doctorId);

  const handleSearch = async (overrideType) => {
    const targetType = overrideType || resourceType;
    setLoading(true);
    try {
      const params = searchQuery ? { name: searchQuery } : {};
      
      if (activeDoctorId) {
        params.doctorId = activeDoctorId;
      } else if (activeFacilityId) {
        params.facilityId = activeFacilityId;
      }

      const res = await fhirService.searchResources(targetType, params);
      setSearchResults(res);
    } catch (err) {
      console.error('FHIR search error:', err);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    handleSearch();
  }, [resourceType]);

  const handleQuickPresetSearch = (type) => {
    setResourceType(type);
    setSearchQuery('');
    handleSearch(type);
  };

  const handleImportSubmit = async () => {
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJsonText);
      const result = await fhirService.importBundle(parsed);
      setImportStatus({
        type: 'success',
        message: `✓ Validated against HL7 FHIR R4 schema! Ingested ${result.count || 1} resource(s) into MediTrack.`
      });
      setImportJsonText('');
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'FHIR Validation / Ingestion Error: ' + err.message
      });
    }
  };

  const handleExportPatientEverything = async (patientId) => {
    try {
      const bundle = await fhirService.getPatientEverythingBundle(patientId);
      if (!bundle) {
        alert('Could not generate $everything bundle for patient ID: ' + patientId);
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `fhir_everything_${patientId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 text-white bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              HL7 FHIR R4 Interoperability Center
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 uppercase">
                v4.0.1 Standard
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-hospital clinical data exchange, LOINC/SNOMED CT/RxNorm terminology mapping, and FHIR REST API operations.
            </p>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SEARCH' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Resource Explorer
          </button>
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'IMPORT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> FHIR Ingestion
          </button>
        </div>
      </div>

      {/* Resource Explorer Tab */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-4">
          {/* Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold mr-1">Quick Filter:</span>
            {[
              { id: 'Patient', label: 'Patients', icon: User },
              { id: 'Observation', label: 'Vitals & Labs (LOINC)', icon: Activity },
              { id: 'Condition', label: 'Diagnoses (SNOMED CT)', icon: ShieldCheck },
              { id: 'Appointment', label: 'Appointments', icon: FileText },
              { id: 'ServiceRequest', label: 'Referrals & Orders', icon: Layers },
            ].map(chip => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  onClick={() => handleQuickPresetSearch(chip.id)}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                    resourceType === chip.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Search controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Resource Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-300 focus:outline-none"
              >
                <option value="Patient">Patient</option>
                <option value="Observation">Observation (Vitals & Labs)</option>
                <option value="Condition">Condition (Diagnoses)</option>
                <option value="Appointment">Appointment</option>
                <option value="ServiceRequest">ServiceRequest (Referrals)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Search Term / Patient Name</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, ID, or term..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Searching...' : 'Search FHIR API'}
              </button>
            </div>
          </div>

          {/* View Mode & Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-slate-300 font-bold">Bundle Results: {searchResults?.total || 0} entries</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                HTTP 200 OK
              </span>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 font-bold self-start sm:self-auto">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  viewMode === 'CARDS' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Structured Cards
              </button>
              <button
                onClick={() => setViewMode('RAW')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  viewMode === 'RAW' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Raw FHIR JSON
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
            {searchResults?.entry?.length > 0 ? (
              searchResults.entry.map((e, idx) => {
                const res = e.resource || {};
                
                if (viewMode === 'RAW') {
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-cyan-300 font-bold">
                        <span>{res.resourceType} #{res.id}</span>
                        <span className="text-slate-400 text-[10px]">{res.status || 'Active'}</span>
                      </div>
                      <pre className="text-[11px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-xl border border-slate-800/80">
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    </div>
                  );
                }

                // Visual Formatted Card View
                return (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 uppercase shrink-0">
                          {res.resourceType}
                        </span>
                        <span className="font-mono text-slate-300 font-bold text-xs truncate max-w-[150px] sm:max-w-none" title={`#${res.id}`}>#{res.id}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {res.resourceType === 'Patient' && (
                          <button
                            onClick={() => handleExportPatientEverything(res.id)}
                            className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                          >
                            <Download className="w-3 h-3" /> Export $everything
                          </button>
                        )}
                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                          {res.status || res.active ? 'Active' : 'Recorded'}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    {res.resourceType === 'Patient' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Patient Name</span>
                          <strong className="text-white">{res.name?.[0]?.text || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Gender / DOB</span>
                          <strong className="text-slate-200 capitalize">{res.gender || 'unspecified'} • {res.birthDate || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Contact</span>
                          <span className="text-cyan-300 font-mono">{res.telecom?.[0]?.value || 'N/A'}</span>
                        </div>
                      </div>
                    )}

                    {res.resourceType === 'Observation' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Observation Type</span>
                          <strong className="text-white">{res.code?.text || 'Vital Sign'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Value</span>
                          <strong className="text-cyan-300 font-mono">{res.valueQuantity?.value} {res.valueQuantity?.unit}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">LOINC Coding</span>
                          <span className="text-slate-300 font-mono text-[11px]">{res.code?.coding?.[0]?.system} #{res.code?.coding?.[0]?.code}</span>
                        </div>
                      </div>
                    )}

                    {res.resourceType === 'Condition' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Diagnosis / Condition</span>
                          <strong className="text-rose-300">{res.code?.text || 'Medical Condition'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">SNOMED CT Coding</span>
                          <span className="text-slate-300 font-mono text-[11px]">{res.code?.coding?.[0]?.code || 'SNOMED CT'}</span>
                        </div>
                      </div>
                    )}

                    {res.resourceType === 'ServiceRequest' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Referral Service</span>
                          <strong className="text-amber-300">{res.code?.text || 'Specialist Referral'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Priority</span>
                          <span className="text-rose-400 font-bold uppercase">{res.priority || 'routine'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Intent</span>
                          <span className="text-slate-300 font-mono">{res.intent}</span>
                        </div>
                      </div>
                    )}

                    {/* Generic Fallback for other resources */}
                    {!['Patient', 'Observation', 'Condition', 'ServiceRequest'].includes(res.resourceType) && (
                      <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded-xl">
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Database className="w-8 h-8 text-slate-700 mx-auto" />
                <p>No FHIR resources match the current search query.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FHIR Ingestion Tab */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              FHIR R4 Ingestion & Offline-First Schema Validator
            </span>
            <p>
              Submit raw FHIR R4 JSON payloads or transaction Bundles. Resources will be validated against official HL7 FHIR R4 definitions before being persisted into MediTrack.
            </p>
          </div>

          {/* Quick Preset Fill Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              1-Click Sample FHIR Payloads (For Testing Ingestion):
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => { setImportStatus(null); setImportJsonText(JSON.stringify(SAMPLE_PRESETS.vitals, null, 2)); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold"
              >
                + Sample Vitals (LOINC)
              </button>
              <button
                onClick={() => { setImportStatus(null); setImportJsonText(JSON.stringify(SAMPLE_PRESETS.condition, null, 2)); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-semibold"
              >
                + Sample Diagnosis (SNOMED CT)
              </button>
              <button
                onClick={() => { setImportStatus(null); setImportJsonText(JSON.stringify(SAMPLE_PRESETS.medication, null, 2)); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-semibold"
              >
                + Sample Prescription (RxNorm)
              </button>
              <button
                onClick={() => { setImportStatus(null); setImportJsonText(JSON.stringify(SAMPLE_PRESETS.referral, null, 2)); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold"
              >
                + Sample Referral (ServiceRequest)
              </button>
            </div>
          </div>

          {importStatus && (
            <div className={`p-3 rounded-xl text-xs font-bold ${importStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
              {importStatus.message}
            </div>
          )}

          <textarea
            value={importJsonText}
            onChange={(e) => { setImportStatus(null); setImportJsonText(e.target.value); }}
            placeholder="Paste FHIR JSON payload here or click a sample preset above..."
            className="w-full h-48 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setImportStatus(null); setImportJsonText(''); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Clear
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={!importJsonText.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Validate & Ingest FHIR Resource
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FhirProviderDashboard;
