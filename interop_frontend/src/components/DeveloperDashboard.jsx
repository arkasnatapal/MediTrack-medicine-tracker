import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Shield, Plus, CheckCircle, Copy, Radio, Lock } from 'lucide-react';
import { API_BASE } from '../config';

export default function DeveloperDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [createdClient, setCreatedClient] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/clients`);
      setClients(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    if (!newClientName) return;
    try {
      const res = await axios.post(`${API_BASE}/clients`, {
        name: newClientName,
        scopes: ['patient/*.read', 'observation/*.write', 'encounter/*.read'],
        role: 'Integration Client'
      });
      setCreatedClient(res.data.data);
      setNewClientName('');
      fetchClients();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[#a6f120] font-semibold text-xs font-mono">
              <Shield className="h-4 w-4" />
              <span>OAuth 2.0 & SMART-on-FHIR Gateway</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1 font-display">Developer Access Credentials & Clients</h1>
            <p className="text-sm text-white/60 mt-1 max-w-2xl">
              Connect external Hospital Information Systems (HIS), Electronic Health Records (EHR), and diagnostic labs securely through standardized APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Register Client Form */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <Key className="h-5 w-5 text-[#a6f120]" />
          <span>Register New Integration Client Application</span>
        </h2>
        <form onSubmit={handleRegisterClient} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="App Name (e.g. Apollo Telehealth Portal)"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#a6f120]"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-xs rounded-full flex items-center justify-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Credentials</span>
          </button>
        </form>

        {createdClient && (
          <div className="p-4 bg-[#020d09] border border-[#a6f120]/40 rounded-2xl space-y-2 font-mono text-xs text-emerald-300 mt-4">
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#a6f120]" />
              <span>Credentials Created Successfully! Keep your Client Secret secure.</span>
            </div>
            <div>Client ID: <strong className="text-white">{createdClient.clientId}</strong></div>
            <div>Client Secret: <strong className="text-[#a6f120]">{createdClient.clientSecret}</strong></div>
            <div>Organization ID: <strong className="text-cyan-300">{createdClient.organizationId}</strong></div>
          </div>
        )}
      </div>

      {/* Existing Clients List */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white font-display">Active Registered Clients ({clients.length})</h2>
        <div className="divide-y divide-white/5 font-mono text-xs">
          {clients.map((c, idx) => (
            <div key={c.clientId || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white/80">
              <div>
                <div className="font-bold text-white">{c.name}</div>
                <div className="text-white/40 text-[11px]">ID: {c.clientId}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-[#a6f120]/15 text-[#a6f120] rounded-full text-[10px] border border-[#a6f120]/30 font-bold">
                  {c.role || 'Active Client'}
                </span>
                <span className="text-white/40 text-[11px]">{c.organizationId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
