import React from 'react';
import { Code, BookOpen, Layers } from 'lucide-react';

export default function ApiDocumentation() {
  const endpoints = [
    { method: 'GET', path: '/fhir/Patient', desc: 'Search FHIR Patient resources (supports ?name=...)' },
    { method: 'GET', path: '/fhir/Patient/{id}/$everything', desc: 'Export complete patient clinical history bundle' },
    { method: 'POST', path: '/fhir/Observation', desc: 'Ingest vital signs / laboratory observations (LOINC coded)' },
    { method: 'POST', path: '/fhir/Encounter', desc: 'Record outpatient visit / clinical encounter' },
    { method: 'POST', path: '/fhir/Condition', desc: 'Record medical condition / diagnosis (SNOMED CT coded)' },
    { method: 'POST', path: '/fhir/MedicationRequest', desc: 'Issue prescription order (RxNorm coded)' },
    { method: 'POST', path: '/api/v1/triage', desc: 'Submit symptoms for AI clinical triage (Explicitly tagged as AI assessment)' },
    { method: 'POST', path: '/api/v1/auth/token', desc: 'OAuth 2.0 client credentials access token exchange' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          <span>API & FHIR Documentation</span>
        </h2>
        <p className="text-sm text-slate-400">Complete endpoint catalog for developers and hospital integration teams.</p>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Core Interoperability Endpoints</h3>
        <div className="divide-y divide-slate-800">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${ep.method === 'GET' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {ep.method}
                </span>
                <span className="font-mono text-sm text-white">{ep.path}</span>
              </div>
              <span className="text-xs text-slate-400">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
