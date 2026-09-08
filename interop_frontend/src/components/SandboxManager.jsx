import React, { useState } from 'react';
import axios from 'axios';
import { Shield, RefreshCw, CheckCircle, Database } from 'lucide-react';
import { API_BASE } from '../config';

export default function SandboxManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/sandbox/seed`);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Resetting sandbox will clear test data for your organization. Continue?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_BASE}/sandbox/reset`);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-cyan-400" />
          <span>Interactive Integration Sandbox</span>
        </h2>
        <p className="text-sm text-slate-400">Safely test FHIR API requests, OAuth flows, and webhooks against synthetic multi-tenant clinical datasets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Database className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Seed Synthetic Dataset</h3>
          <p className="text-xs text-slate-400">
            Populates your sandbox organization with realistic synthetic Patient records (Rahul Verma), vital signs (LOINC), diagnoses (SNOMED CT), and medication prescriptions (RxNorm).
          </p>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-sm shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Seed Synthetic Data
          </button>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <RefreshCw className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Reset Sandbox Data</h3>
          <p className="text-xs text-slate-400">
            Wipes all test resources created in your organization, returning your sandbox environment to a pristine state.
          </p>
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-sm border border-slate-700 flex items-center justify-center gap-2"
          >
            Reset Organization Sandbox
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          <CheckCircle className="h-5 w-5" />
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
