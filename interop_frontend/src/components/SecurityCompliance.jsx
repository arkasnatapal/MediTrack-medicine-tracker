import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Lock, FileText, CheckCircle2, Eye, UserCheck, KeyRound, RefreshCw, Activity, Terminal } from 'lucide-react';
import { API_BASE } from '../config';

export default function SecurityCompliance() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/audit/logs`, {
        headers: { 'X-Organization-ID': 'org_apollo_metro', 'Authorization': 'Bearer demo_token' }
      });
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-[#a6f120]/15 border border-[#a6f120]/30 rounded-full text-xs font-semibold text-[#a6f120] mb-2 font-mono">
          <Shield className="h-3.5 w-3.5" />
          <span>Enterprise Security & HIPAA Audit Framework</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display">Security, Consent & Compliance Architecture</h1>
        <p className="text-sm text-white/60 mt-1">
          Enterprise-grade security controls enforcing multi-tenant isolation, SMART-on-FHIR scopes, patient consent, and immutable auditability.
        </p>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl hover:border-[#a6f120]/50 transition-all">
          <div className="h-10 w-10 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center font-bold">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">Multi-Tenant Database Isolation</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Healthcare provider data separation is enforced at the database query layer using unique <code className="text-[#a6f120]">organizationId</code> partitions. Cross-tenant access attempts trigger security alerts and return HTTP 403 Forbidden.
          </p>
        </div>

        <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl hover:border-[#a6f120]/50 transition-all">
          <div className="h-10 w-10 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">Dynamic Patient Consent Engine</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Support for HL7 FHIR <code className="text-[#a6f120]">Consent</code> resource validation ensuring patient data exchange agreements and ABDM health information provider (HIP/HIU) consent handles are validated before data access.
          </p>
        </div>

        <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl hover:border-[#a6f120]/50 transition-all">
          <div className="h-10 w-10 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center font-bold">
            <KeyRound className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">SMART-on-FHIR Scopes</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Granular OAuth 2.0 access control enforcing fine-grained scope evaluation (e.g., <code className="text-[#a6f120]">patient/*.read</code>, <code className="text-[#a6f120]">observation/*.write</code>).
          </p>
        </div>

        <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl hover:border-[#a6f120]/50 transition-all">
          <div className="h-10 w-10 rounded-2xl bg-[#a6f120]/15 text-[#a6f120] border border-[#a6f120]/30 flex items-center justify-center font-bold">
            <Eye className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">HIPAA § 164.312 Audit Trails</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Immutable recording of every API request recording actor identity, request path, status code, IP address, and timestamp for audit inspections.
          </p>
        </div>
      </div>

      {/* Real-Time Audit Log Table */}
      <div className="bg-[#041912] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Activity className="h-5 w-5 text-[#a6f120]" />
            <span>Live HIPAA Audit Event Log Stream</span>
          </h2>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#020d09] hover:bg-white/5 text-white/80 rounded-xl border border-white/15 text-xs font-mono flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#a6f120]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="divide-y divide-white/5 font-mono text-xs max-h-80 overflow-y-auto">
          {auditLogs.map((log, idx) => (
            <div key={log.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white/80">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.statusCode < 400 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {log.statusCode || 200}
                </span>
                <span className="font-bold text-[#a6f120]">{log.method} {log.path}</span>
                <span className="text-white/40 text-[11px]">Actor: {log.clientId || 'org_apollo'}</span>
              </div>
              <div className="flex items-center space-x-4 text-[11px] text-white/50">
                <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                <span>{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
