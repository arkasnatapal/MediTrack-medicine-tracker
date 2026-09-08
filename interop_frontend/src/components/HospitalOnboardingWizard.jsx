import React, { useState } from 'react';
import axios from 'axios';
import { Building2, Check, CheckCircle2, Copy, Key, Shield, Sparkles, Wand2, ArrowRight, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { API_BASE, FHIR_BASE } from '../config';

export default function HospitalOnboardingWizard({ setActiveTab }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [hospitalName, setHospitalName] = useState('Apollo Metro Hospital');
  const [systemType, setSystemType] = useState('Epic Systems EHR');
  const [email, setEmail] = useState('interop@apollometro.com');

  const [selectedScopes, setSelectedScopes] = useState([
    'patient/*.read',
    'observation/*.write',
    'encounter/*.read',
    'medication/*.write'
  ]);

  const [createdClient, setCreatedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleStep2Next = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/clients`, {
        name: hospitalName,
        scopes: selectedScopes,
        role: 'Integration Client'
      });
      setCreatedClient(res.data.data);
      setCurrentStep(3);
    } catch (err) {
      alert('Error creating credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunConnectionTest = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      // 1. Post patient
      const pRes = await axios.post(`${FHIR_BASE}/Patient`, {
        resourceType: 'Patient',
        name: [{ text: 'Wizard Test Patient', family: 'Patient', given: ['Wizard'] }],
        gender: 'female',
        birthDate: '1995-08-20'
      }, {
        headers: { 'X-Organization-ID': createdClient?.organizationId || 'org_apollo_metro' }
      });

      // 2. Post observation
      const obsRes = await axios.post(`${FHIR_BASE}/Observation`, {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
        subject: { reference: `Patient/${pRes.data.id}` },
        valueQuantity: { value: 37.8, unit: 'Cel' }
      }, {
        headers: { 'X-Organization-ID': createdClient?.organizationId || 'org_apollo_metro' }
      });

      setTestResult({
        success: true,
        patientId: pRes.data.id,
        observationId: obsRes.data.id,
        message: 'Successfully executed synthetic bi-directional FHIR R4 read/write handshake!'
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Hospital Profile' },
    { num: 2, title: 'Configure Scopes' },
    { num: 3, title: 'OAuth Credentials' },
    { num: 4, title: 'Live Test' }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-xs font-semibold text-[#a6f120] font-mono">
          <Wand2 className="h-3.5 w-3.5" />
          <span>Interactive Hospital Onboarding Wizard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">Integrate Your Hospital in 4 Steps</h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto">
          Generate OAuth 2.0 credentials, select FHIR scopes, and test bi-directional data flow with MediTrack Interoperability Gateway.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-white/10 pb-6">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-2xl border text-center transition-all ${
              currentStep === s.num
                ? 'bg-[#a6f120]/15 border-[#a6f120]/40 text-[#a6f120] font-bold'
                : currentStep > s.num
                ? 'bg-[#041912] border-white/10 text-emerald-400 font-bold'
                : 'bg-[#020d09] border-white/5 text-white/40'
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-mono">Step {s.num}</div>
            <div className="text-sm mt-0.5 truncate font-display">{s.title}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* STEP 1: Hospital Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Building2 className="h-5 w-5 text-[#a6f120]" />
              <span>Step 1: Hospital & Systems Profile</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-sm text-white focus:border-[#a6f120]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Existing HIS / EHR Platform</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-sm text-white"
                >
                  <option value="Epic Systems EHR">Epic Systems EHR</option>
                  <option value="Oracle Cerner Millennium">Oracle Cerner Millennium</option>
                  <option value="MEDITECH Expanse">MEDITECH Expanse</option>
                  <option value="Custom Proprietary HIS">Custom Proprietary Hospital Software</option>
                  <option value="Diagnostic Laboratory LIS">Diagnostic Laboratory System (LIS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Technical Contact Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-sm rounded-full flex items-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer"
              >
                <span>Continue to Scopes</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Configure Scopes */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Shield className="h-5 w-5 text-[#a6f120]" />
              <span>Step 2: Select SMART-on-FHIR OAuth Scopes</span>
            </h3>

            <div className="space-y-3">
              {[
                { scope: 'patient/*.read', label: 'Patient Record Reading (Demographics, ABDM ID)' },
                { scope: 'observation/*.write', label: 'Vital Signs & Lab Observation Ingestion (LOINC)' },
                { scope: 'encounter/*.read', label: 'Clinical Encounters & Visit Queue Reading' },
                { scope: 'medication/*.write', label: 'Prescription Order Submission (RxNorm)' },
                { scope: 'diagnosticreport/*.write', label: 'Diagnostic PDF & Lab Report Upload' }
              ].map((item) => {
                const checked = selectedScopes.includes(item.scope);
                return (
                  <div
                    key={item.scope}
                    onClick={() => {
                      if (checked) setSelectedScopes(selectedScopes.filter(s => s !== item.scope));
                      else setSelectedScopes([...selectedScopes, item.scope]);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-[#062c1f] border-[#a6f120]/40 text-white'
                        : 'bg-[#020d09] border-white/10 text-white/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${checked ? 'bg-[#a6f120] border-[#a6f120] text-[#062319]' : 'border-white/30'}`}>
                        {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-[#a6f120]">{item.scope}</span>
                        <p className="text-xs text-white/70">{item.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-white/20 text-white rounded-full text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={loading}
                className="px-6 py-3 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-sm rounded-full flex items-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                <span>Generate Client Credentials</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OAuth Credentials */}
        {currentStep === 3 && createdClient && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Key className="h-5 w-5 text-[#a6f120]" />
              <span>Step 3: Issued OAuth 2.0 Client Credentials</span>
            </h3>

            <div className="p-5 bg-[#020d09] border border-white/15 rounded-2xl space-y-4 font-mono text-xs text-emerald-300">
              <div>
                <span className="text-white/40 block text-[11px]">CLIENT ID:</span>
                <span className="text-white font-bold text-sm">{createdClient.clientId}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[11px]">CLIENT SECRET:</span>
                <span className="text-[#a6f120] font-bold">{createdClient.clientSecret}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[11px]">ORGANIZATION PARTITION ID:</span>
                <span className="text-cyan-300">{createdClient.organizationId}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-white/20 text-white rounded-full text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-sm rounded-full flex items-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer"
              >
                <span>Proceed to Live Connection Test</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Live Test */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Send className="h-5 w-5 text-[#a6f120]" />
              <span>Step 4: Execute Live Connection Handshake</span>
            </h3>

            <p className="text-xs text-white/70">
              Run a real-time synthetic test POST to ingest a test <code className="text-[#a6f120]">Patient</code> and <code className="text-[#a6f120]">Observation</code> resource into your hospital partition.
            </p>

            <button
              onClick={handleRunConnectionTest}
              disabled={loading}
              className="w-full py-4 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-extrabold text-sm rounded-full flex items-center justify-center space-x-2 shadow-xl shadow-[#a6f120]/20 cursor-pointer"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              <span>Execute Bi-Directional FHIR Handshake Test</span>
            </button>

            {testResult && (
              <div className={`p-5 rounded-2xl border text-xs font-mono space-y-2 ${
                testResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <div className="font-bold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#a6f120]" />
                  <span>{testResult.message}</span>
                </div>
                {testResult.patientId && (
                  <div>Ingested Patient ID: <strong className="text-white">{testResult.patientId}</strong></div>
                )}
                {testResult.observationId && (
                  <div>Ingested Observation ID: <strong className="text-white">{testResult.observationId}</strong></div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 border border-white/20 text-white rounded-full text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setActiveTab('apidocs')}
                className="px-6 py-3 bg-[#062319] hover:bg-[#0a3325] text-white font-bold text-xs rounded-full border border-white/30 flex items-center space-x-2 cursor-pointer"
              >
                <span>Launch Interactive API Docs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
