import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, CheckCircle, AlertTriangle, RefreshCw, Database, Download, FileJson, Check, Shield } from 'lucide-react';
import { FHIR_BASE as API_BASE } from '../config';

const RESOURCES = [
  'Patient', 'Observation', 'Encounter', 'Condition', 'MedicationRequest',
  'DiagnosticReport', 'Appointment', 'Practitioner', 'Organization', 'Location',
  'ServiceRequest', 'DocumentReference', 'CarePlan', 'AllergyIntolerance',
  'Procedure', 'PractitionerRole', 'RelatedPerson', 'Device', 'Immunization', 'Medication'
];

export default function FhirExplorer() {
  const [selectedResource, setSelectedResource] = useState('Patient');
  const [searchParam, setSearchParam] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'create' | 'validator'
  const [validationResult, setValidationResult] = useState(null);
  const [viewMode, setViewMode] = useState('JSON'); // 'JSON' | 'VISUAL'

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/${selectedResource}`;
      if (searchParam) {
        url += `?name=${encodeURIComponent(searchParam)}&patient=${encodeURIComponent(searchParam)}`;
      }
      const res = await axios.get(url, {
        headers: { 'X-Organization-ID': 'org_apollo_metro', 'Authorization': 'Bearer demo_token' }
      });
      setResults(res.data);
      if (res.data.entry && res.data.entry.length > 0) {
        setSelectedItem(res.data.entry[0].resource);
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      setError(err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedResource]);

  const handleCreateResource = async () => {
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      setValidationResult(null);
      const res = await axios.post(`${API_BASE}/${selectedResource}`, parsed, {
        headers: { 'X-Organization-ID': 'org_apollo_metro', 'Authorization': 'Bearer demo_token' }
      });
      setValidationResult({
        success: true,
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'information', code: 'informational', details: { text: `Successfully ingested ${selectedResource}/${res.data.id}` } }]
      });
      fetchResources();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationResult({ success: false, message: 'Invalid JSON Syntax format' });
      } else {
        setValidationResult({ success: false, data: err.response ? err.response.data : { message: err.message } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportEverything = async (patientId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/Patient/${patientId}/$everything`, {
        headers: { 'X-Organization-ID': 'org_apollo_metro', 'Authorization': 'Bearer demo_token' }
      });
      setResults(res.data);
      setSelectedItem(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-xs font-semibold text-[#a6f120] mb-2 font-mono">
            <Database className="h-3.5 w-3.5" />
            <span>HL7 FHIR Release 4 (4.0.1) Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 font-display">
            <span>Live FHIR R4 Resource Explorer & Inspector</span>
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Browse, search, validate, and ingest HL7 FHIR clinical resources in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['browse', 'create'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'create' && !jsonInput) {
                  setJsonInput(JSON.stringify({
                    resourceType: selectedResource,
                    status: 'active',
                    meta: { profile: ['http://hl7.org/fhir/StructureDefinition/' + selectedResource] }
                  }, null, 2));
                }
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#a6f120] text-[#062319] shadow-lg shadow-[#a6f120]/20'
                  : 'bg-[#020d09] border border-white/15 text-white/70 hover:text-white'
              }`}
            >
              {tab === 'browse' ? 'Browse & Search' : '+ Ingest FHIR Resource'}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Resource Pills Bar */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none font-mono">
        {RESOURCES.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedResource(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedResource === r
                ? 'bg-[#a6f120] text-[#062319] font-bold shadow-md shadow-[#a6f120]/20 ring-1 ring-[#a6f120]'
                : 'bg-[#041912] border border-white/10 text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {activeTab === 'browse' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Search & Resource List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder={`Search ${selectedResource} by name/ID...`}
                  value={searchParam}
                  onChange={(e) => setSearchParam(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#020d09] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#a6f120]"
                />
              </div>
              <button
                onClick={fetchResources}
                disabled={loading}
                className="px-3.5 py-2 bg-[#041912] hover:bg-[#062c1f] text-white rounded-xl border border-white/10 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#a6f120]' : ''}`} />
              </button>
            </div>

            <div className="bg-[#041912] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-[450px]">
              <div className="px-4 py-3 bg-[#020d09] border-b border-white/10 flex justify-between items-center text-xs font-mono text-white/60">
                <span>{selectedResource} Bundle ({results?.total || 0} items)</span>
                <span className="text-[10px] text-[#a6f120] font-bold">GET /fhir/{selectedResource}</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-white/50 text-xs flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#a6f120]" />
                  <span>Loading FHIR R4 Bundle...</span>
                </div>
              ) : results?.entry?.length > 0 ? (
                <div className="divide-y divide-white/5 max-h-[550px] overflow-y-auto">
                  {results.entry.map((e, idx) => {
                    const r = e.resource;
                    const isSelected = selectedItem?.id === r.id;
                    return (
                      <div
                        key={r.id || idx}
                        onClick={() => setSelectedItem(r)}
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#062c1f] border-l-4 border-[#a6f120] text-white shadow-lg'
                            : 'hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-[#a6f120]">{r.resourceType}/{r.id}</span>
                          {r.status && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#020d09] text-emerald-400 border border-emerald-500/30">
                              {r.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-white mt-1 truncate font-display">
                          {r.name?.[0]?.text || r.code?.text || r.reason || r.title || 'FHIR Resource Entity'}
                        </div>
                        <div className="text-[11px] text-white/50 mt-0.5 truncate font-mono">
                          {r.telecom?.[0]?.value || r.code?.coding?.[0]?.display || r.authoredOn || r.effectiveDateTime || 'HL7 FHIR R4 Object'}
                        </div>
                        {r.resourceType === 'Patient' && (
                          <button
                            onClick={(evt) => {
                              evt.stopPropagation();
                              handleExportEverything(r.id);
                            }}
                            className="mt-2 text-[11px] font-bold text-[#a6f120] hover:underline flex items-center gap-1 bg-[#a6f120]/15 px-2.5 py-1 rounded-lg border border-[#a6f120]/30 w-fit cursor-pointer"
                          >
                            <Download className="h-3 w-3" /> Export $everything Bundle
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-white/40 text-xs">
                  No {selectedResource} resources found in database.<br />Click "+ Ingest FHIR Resource" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#041912] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-3.5 bg-[#020d09] border-b border-white/10 flex justify-between items-center text-xs font-mono">
                <div className="flex items-center space-x-2 text-white">
                  <FileJson className="h-4 w-4 text-[#a6f120]" />
                  <span className="font-bold">{selectedItem ? `${selectedItem.resourceType}/${selectedItem.id}` : 'Resource Inspector'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-white/50 bg-[#062319] px-2 py-0.5 rounded border border-white/10">
                    application/fhir+json
                  </span>
                </div>
              </div>

              <div className="p-5 font-mono text-xs bg-[#020d09] text-emerald-300 overflow-x-auto min-h-[420px] max-h-[550px]">
                {selectedItem ? (
                  <pre className="text-slate-200">
                    <code>{JSON.stringify(selectedItem, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40">
                    Select a resource item from the bundle to inspect
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Ingest / Create Resource Tab */
        <div className="bg-[#041912] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white font-display">Ingest New {selectedResource} Payload</h2>
            <p className="text-xs text-white/60">
              Provide a valid HL7 FHIR R4 JSON representation of <code className="text-[#a6f120]">{selectedResource}</code>.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-white/80 font-bold block">JSON PAYLOAD BODY</label>
            <textarea
              rows={12}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full p-4 bg-[#020d09] border border-white/15 rounded-2xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-[#a6f120] shadow-inner"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActiveTab('browse')}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white hover:bg-white/10 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateResource}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] text-xs font-bold shadow-lg shadow-[#a6f120]/20 flex items-center space-x-2 cursor-pointer"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Ingest & Validate FHIR Object</span>
            </button>
          </div>

          {validationResult && (
            <div className={`p-4 rounded-2xl border text-xs font-mono ${
              validationResult.success 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}>
              <pre><code>{JSON.stringify(validationResult, null, 2)}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
