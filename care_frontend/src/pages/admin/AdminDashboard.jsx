import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ShieldCheck, Building2, Stethoscope, CheckCircle, XCircle, AlertOctagon, RefreshCw, FileText, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('verification');
  const [metrics, setMetrics] = useState(null);
  const [pendingFacilities, setPendingFacilities] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [metRes, pendRes, logRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/pending'),
        api.get('/admin/audit-logs'),
      ]);
      setMetrics(metRes.data);
      setPendingFacilities(pendRes.data.facilities);
      setPendingDoctors(pendRes.data.doctors);
      setAuditLogs(logRes.data);
    } catch (err) {
      console.error('Failed to load admin oversight data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyFacility = async (id, status) => {
    try {
      await api.put(`/admin/verify-facility/${id}`, { status });
      alert(`Facility set to ${status}`);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed');
    }
  };

  const handleVerifyDoctor = async (id, status) => {
    try {
      await api.put(`/admin/verify-doctor/${id}`, { status });
      alert(`Doctor set to ${status}`);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col md:flex-row relative overflow-hidden selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Grainy Texture Overlay */}
      <div className="grainy-overlay" />

      {/* Floating Ambient Mesh Orbs */}
      <div className="ambient-orb-purple -top-20 -left-20 animate-float-slow" />
      <div className="ambient-orb-cyan bottom-10 right-10 animate-float-reverse" />

      {/* Sidebar */}
      <aside className="w-full md:w-64 liquid-glass border-r border-white/10 p-6 flex flex-col justify-between shrink-0 relative z-20 backdrop-blur-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold text-white">System Admin</h2>
              <span className="text-[10px] font-tech text-amber-300 font-bold uppercase tracking-wider block">Root Oversight</span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-tech font-semibold">
            {[
              { id: 'verification', label: 'Provider Verification', icon: CheckCircle },
              { id: 'metrics', label: 'Platform Analytics', icon: Building2 },
              { id: 'audit', label: 'Security Audit Logs', icon: FileText },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === item.id ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center space-x-2 text-xs font-semibold text-rose-400 hover:text-rose-300">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Screen */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab} Console</h1>
            <p className="text-xs text-slate-400">MediTrack Care Network Central Administration</p>
          </div>
          <button onClick={loadAdminData} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-8">
            {/* Pending Facilities */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Pending Healthcare Facility Approvals ({pendingFacilities.length})</h3>
              {pendingFacilities.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No pending facility registrations.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {pendingFacilities.map(f => (
                    <div key={f._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{f.name} ({f.facilityType})</div>
                        <div className="text-slate-400">License: {f.licenseId} • Admin: {f.adminName} ({f.adminEmail})</div>
                        <div className="text-slate-500 text-[10px] mt-1">{f.address}, {f.district}, {f.state}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleVerifyFacility(f._id, 'VERIFIED')} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">VERIFY</button>
                        <button onClick={() => handleVerifyFacility(f._id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold">REJECT</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Doctors */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Pending Doctor Registration Approvals ({pendingDoctors.length})</h3>
              {pendingDoctors.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No pending doctor registrations.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {pendingDoctors.map(d => (
                    <div key={d._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{d.fullName} ({d.specialization})</div>
                        <div className="text-slate-400">Reg No: {d.medicalRegistrationNumber} • {d.registrationAuthority}</div>
                        <div className="text-slate-500 text-[10px] mt-1">Qualification: {d.qualification} • Exp: {d.experienceYears} yrs</div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleVerifyDoctor(d._id, 'VERIFIED')} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">VERIFY</button>
                        <button onClick={() => handleVerifyDoctor(d._id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold">REJECT</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Security Audit Trail Log</h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {auditLogs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{log.userName}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">{log.userRole}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.targetEntity}</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && metrics && (
          <div className="grid md:grid-cols-3 gap-6 text-xs">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 mb-1">Facilities Count</div>
              <div className="text-3xl font-bold text-white">{metrics.facilities.total} Total</div>
              <div className="text-emerald-400 mt-2">{metrics.facilities.verified} Verified • {metrics.facilities.pending} Pending</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 mb-1">Doctors Count</div>
              <div className="text-3xl font-bold text-white">{metrics.doctors.total} Total</div>
              <div className="text-cyan-400 mt-2">{metrics.doctors.verified} Verified • {metrics.doctors.pending} Pending</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 mb-1">Active Transfers & Referrals</div>
              <div className="text-3xl font-bold text-amber-400">{metrics.activeTransfers} Transfers</div>
              <div className="text-slate-300 mt-2">{metrics.activeReferrals} Active Referrals</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
