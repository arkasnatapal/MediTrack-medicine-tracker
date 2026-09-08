import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radio, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { API_BASE } from '../config';

export default function WebhookManager() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['patient.created', 'observation.created', 'triage.completed']);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE}/webhooks`),
        axios.get(`${API_BASE}/webhooks/logs`)
      ]);
      setSubscriptions(subsRes.data.data || []);
      setLogs(logsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    if (!url) return;
    try {
      await axios.post(`${API_BASE}/webhooks`, {
        name: name || 'Hospital Webhook Listener',
        url,
        events: selectedEvents
      });
      setUrl('');
      setName('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSub = async (id) => {
    try {
      await axios.delete(`${API_BASE}/webhooks/${id}`);
      fetchData();
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
              <Radio className="h-4 w-4" />
              <span>Real-Time Event Webhook Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1 font-display">HMAC-SHA256 Signed Webhook Dispatcher</h1>
            <p className="text-sm text-white/60 mt-1 max-w-2xl">
              Receive instant JSON HTTP POST payloads directly in your hospital backend whenever clinical FHIR resources are created or updated.
            </p>
          </div>
        </div>
      </div>

      {/* Add Webhook Form */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <Plus className="h-5 w-5 text-[#a6f120]" />
          <span>Register New Webhook Endpoint</span>
        </h2>

        <form onSubmit={handleAddWebhook} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Listener Name (e.g. Apollo EHR ADT Listener)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#a6f120]"
            />
            <input
              type="url"
              placeholder="Webhook Target URL (https://hospital.org/api/webhooks)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="px-4 py-2.5 bg-[#020d09] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#a6f120]"
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#a6f120] hover:bg-[#b8f53c] text-[#062319] font-bold text-xs rounded-full flex items-center space-x-2 shadow-lg shadow-[#a6f120]/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Listener</span>
          </button>
        </form>
      </div>

      {/* Webhook Endpoints List */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white font-display">Active Subscriptions ({subscriptions.length})</h2>
        <div className="divide-y divide-white/5 font-mono text-xs">
          {subscriptions.map((s, idx) => (
            <div key={s.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white/80">
              <div>
                <div className="font-bold text-white">{s.name}</div>
                <div className="text-[#a6f120] text-[11px] truncate">{s.url}</div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] border border-emerald-500/30 font-bold">
                  HMAC Signed
                </span>
                <button
                  onClick={() => handleDeleteSub(s.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Audit Logs */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <Clock className="h-5 w-5 text-[#a6f120]" />
          <span>Recent Dispatch Audit Logs</span>
        </h2>
        <div className="divide-y divide-white/5 font-mono text-xs max-h-60 overflow-y-auto">
          {logs.map((l, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-white/70">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">200 OK</span>
                <span className="text-white font-bold">{l.event}</span>
                <span className="text-white/40 truncate text-[11px]">{l.url}</span>
              </div>
              <span className="text-white/40 text-[11px]">{new Date(l.timestamp || Date.now()).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
