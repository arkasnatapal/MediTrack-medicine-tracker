import React, { useState } from 'react';
import axios from 'axios';
import { Building2, UserPlus, Activity, Stethoscope, Pill, ArrowRight, CheckCircle, RefreshCw, Send } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('patient');
  const [logs, setLogs] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle');

  // Form states
  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [gender, setGender] = useState('female');
  const [dob, setDob] = useState('1994-05-14');
  const [phone, setPhone] = useState('+91-9812345678');
  const [patientFhirId, setPatientFhirId] = useState('');

  const [vitalType, setVitalType] = useState('8310-5'); // Body Temp
  const [vitalValue, setVitalValue] = useState('38.5');
  const [vitalUnit, setVitalUnit] = useState('Cel');

  const [encounterReason, setEncounterReason] = useState('Acute Viral Fever & Headache Consultation');
  const [medName, setMedName] = useState('Paracetamol 500 MG Oral Tablet');
  const [medDosage, setMedDosage] = useState('1 tablet thrice daily after meals');

  const INTEROP_BASE = 'http://localhost:5002/fhir';

  const addLog = (method, endpoint, status, payload) => {
    setLogs((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        status,
        payload
      },
      ...prev
    ]);
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setSyncStatus('syncing');
    const fhirPatient = {
      resourceType: 'Patient',
      id: `Patient-${Date.now()}`,
      name: [{ text: patientName, family: patientName.split(' ').pop(), given: patientName.split(' ').slice(0, -1) }],
      gender: gender,
      birthDate: dob,
      telecom: [{ system: 'phone', value: phone }]
    };

    try {
      const res = await axios.post(`${INTEROP_BASE}/Patient`, fhirPatient, {
        headers: { 'Content-Type': 'application/fhir+json', 'X-Organization-ID': 'org_apollo_metro' }
      });
      setPatientFhirId(res.data.id);
      addLog('POST', `/fhir/Patient`, 201, res.data);
      setSyncStatus('success');
    } catch (err) {
      addLog('POST', `/fhir/Patient`, err.response?.status || 500, err.response?.data || err.message);
      setSyncStatus('error');
    }
  };

  const handleLogVital = async (e) => {
    e.preventDefault();
    setSyncStatus('syncing');
    const fhirObs = {
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: vitalType, display: vitalType === '8310-5' ? 'Body temperature' : 'Systolic BP' }]
      },
      subject: { reference: `Patient/${patientFhirId || 'Patient-Default'}` },
      valueQuantity: { value: parseFloat(vitalValue), unit: vitalUnit }
    };

    try {
      const res = await axios.post(`${INTEROP_BASE}/Observation`, fhirObs, {
        headers: { 'Content-Type': 'application/fhir+json', 'X-Organization-ID': 'org_apollo_metro' }
      });
      addLog('POST', `/fhir/Observation`, 201, res.data);
      setSyncStatus('success');
    } catch (err) {
      addLog('POST', `/fhir/Observation`, err.response?.status || 500, err.response?.data || err.message);
      setSyncStatus('error');
    }
  };

  const handleCreateEncounter = async (e) => {
    e.preventDefault();
    setSyncStatus('syncing');
    const fhirEnc = {
      resourceType: 'Encounter',
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      type: [{ text: encounterReason }],
      subject: { reference: `Patient/${patientFhirId || 'Patient-Default'}` }
    };

    try {
      const res = await axios.post(`${INTEROP_BASE}/Encounter`, fhirEnc, {
        headers: { 'Content-Type': 'application/fhir+json', 'X-Organization-ID': 'org_apollo_metro' }
      });
      addLog('POST', `/fhir/Encounter`, 201, res.data);
      setSyncStatus('success');
    } catch (err) {
      addLog('POST', `/fhir/Encounter`, err.response?.status || 500, err.response?.data || err.message);
      setSyncStatus('error');
    }
  };

  const handlePrescribeMedication = async (e) => {
    e.preventDefault();
    setSyncStatus('syncing');
    const fhirMed = {
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: { text: medName },
      subject: { reference: `Patient/${patientFhirId || 'Patient-Default'}` },
      dosageInstruction: [{ text: medDosage }]
    };

    try {
      const res = await axios.post(`${INTEROP_BASE}/MedicationRequest`, fhirMed, {
        headers: { 'Content-Type': 'application/fhir+json', 'X-Organization-ID': 'org_apollo_metro' }
      });
      addLog('POST', `/fhir/MedicationRequest`, 201, res.data);
      setSyncStatus('success');
    } catch (err) {
      addLog('POST', `/fhir/MedicationRequest`, err.response?.status || 500, err.response?.data || err.message);
      setSyncStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Hospital System Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white tracking-tight">Apollo Metro Hospital</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Mock HIS Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400">External Healthcare Provider EHR Software</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Sync Gateway:</span>
              <span className="text-cyan-400 font-bold">MediTrack Interop Platform (5002)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Interoperability Flow Visualizer */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-white font-bold">Apollo Hospital HIS</div>
                <div className="text-slate-400">Local Database</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-cyan-400">
              <ArrowRight className="h-5 w-5 animate-pulse" />
              <span className="font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">HL7 FHIR R4 JSON</span>
              <ArrowRight className="h-5 w-5 animate-pulse" />
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/80 border border-cyan-500/30 px-4 py-3 rounded-xl shadow-lg shadow-cyan-500/10">
              <Send className="h-5 w-5 text-cyan-400" />
              <div>
                <div className="text-white font-bold">MediTrack Platform Gateway</div>
                <div className="text-cyan-400">http://localhost:5002/fhir</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-emerald-400">
              <ArrowRight className="h-5 w-5 animate-pulse" />
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-white font-bold">Patient & Care Apps</div>
                <div className="text-emerald-400">Unified Live Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Hospital Workflow Forms */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex border-b border-slate-800 gap-2">
            {[
              { id: 'patient', label: '1. Register Patient', icon: UserPlus },
              { id: 'vitals', label: '2. Log Vitals', icon: Activity },
              { id: 'encounter', label: '3. Encounter', icon: Stethoscope },
              { id: 'prescription', label: '4. Prescription', icon: Pill }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-t-lg transition-colors ${
                    activeTab === tab.id ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {activeTab === 'patient' && (
              <form onSubmit={handleRegisterPatient} className="space-y-4">
                <h3 className="text-base font-bold text-white">Hospital Patient Registration</h3>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md shadow-emerald-600/20"
                >
                  Register & Sync to MediTrack FHIR API
                </button>
              </form>
            )}

            {activeTab === 'vitals' && (
              <form onSubmit={handleLogVital} className="space-y-4">
                <h3 className="text-base font-bold text-white">Record Vital Signs</h3>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Vital Sign Type (LOINC Standard)</label>
                  <select
                    value={vitalType}
                    onChange={(e) => {
                      setVitalType(e.target.value);
                      if (e.target.value === '8310-5') { setVitalValue('38.5'); setVitalUnit('Cel'); }
                      else { setVitalValue('135'); setVitalUnit('mm[Hg]'); }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="8310-5">LOINC 8310-5 (Body Temperature)</option>
                    <option value="8480-6">LOINC 8480-6 (Systolic Blood Pressure)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Measured Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalValue}
                      onChange={(e) => setVitalValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Unit (UCUM)</label>
                    <input
                      type="text"
                      value={vitalUnit}
                      onChange={(e) => setVitalUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md shadow-emerald-600/20"
                >
                  Submit Observation (FHIR POST)
                </button>
              </form>
            )}

            {activeTab === 'encounter' && (
              <form onSubmit={handleCreateEncounter} className="space-y-4">
                <h3 className="text-base font-bold text-white">Record Clinical Encounter</h3>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Chief Complaint / Reason</label>
                  <input
                    type="text"
                    value={encounterReason}
                    onChange={(e) => setEncounterReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md shadow-emerald-600/20"
                >
                  Record Encounter (FHIR POST)
                </button>
              </form>
            )}

            {activeTab === 'prescription' && (
              <form onSubmit={handlePrescribeMedication} className="space-y-4">
                <h3 className="text-base font-bold text-white">Issue Medication Prescription</h3>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Medication Name (RxNorm Standard)</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Dosage Instructions</label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md shadow-emerald-600/20"
                >
                  Issue Prescription (FHIR MedicationRequest)
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Outbound FHIR Sync Monitor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white flex items-center justify-between mb-4">
              <span>Outbound FHIR Interoperability Logs</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">Live Transmission</span>
            </h3>

            {logs.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded">{log.method}</span>
                        <span className="text-slate-200">{log.endpoint}</span>
                      </div>
                      <span className={`px-2 py-0.5 font-bold rounded ${log.status >= 200 && log.status < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        HTTP {log.status}
                      </span>
                    </div>
                    <pre className="p-2 bg-slate-900 text-cyan-300 rounded overflow-x-auto text-[11px]">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12 text-sm">
                No outbound FHIR requests sent yet. Use the form on the left to trigger interoperability synchronization.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
