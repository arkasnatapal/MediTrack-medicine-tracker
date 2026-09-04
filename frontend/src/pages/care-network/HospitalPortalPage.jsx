import React, { useState, useEffect } from 'react';
import { Building2, Users, Clock, GitMerge, ShieldAlert, Activity, Pill, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HospitalPortalPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('FAC-MH-PUNE-PHC-01');
  const [selectedDepartment, setSelectedDepartment] = useState('General OPD');
  const [queueData, setQueueData] = useState({
    currentToken: 1,
    totalTokensBooked: 1,
    positionInLine: 0,
    entries: [],
    departmentQueues: {}
  });
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const OPD_DEPARTMENTS = [
    'General OPD',
    'Cardiology OPD',
    'Endocrinology OPD',
    'Neurology OPD',
    'Pediatrics OPD',
    'Orthopedics OPD',
    'Maternal & Gynec OPD',
    'Ayush / Natural Healing'
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      fetchQueueStatus(selectedFacilityId, selectedDepartment);
    }
  }, [selectedFacilityId, selectedDepartment]);

  // Live polling every 3 seconds for hospital administration portal
  useEffect(() => {
    if (!selectedFacilityId) return;
    const interval = setInterval(() => {
      fetchQueueStatus(selectedFacilityId, selectedDepartment);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedFacilityId, selectedDepartment]);

  const fetchFacilities = async () => {
    try {
      const res = await axios.get(`${API_BASE}/care-network/facilities`);
      if (res.data && res.data.facilities && res.data.facilities.length > 0) {
        setFacilities(res.data.facilities);
        if (!selectedFacilityId) {
          setSelectedFacilityId(res.data.facilities[0].facilityId);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const fetchQueueStatus = async (facId, dept = selectedDepartment) => {
    try {
      const res = await axios.get(`${API_BASE}/care-network/queue/${facId}?department=${encodeURIComponent(dept)}`);
      if (res.data && res.data.success) {
        setQueueData({
          currentToken: res.data.currentToken || 1,
          totalTokensBooked: res.data.totalTokensBooked || 1,
          positionInLine: res.data.positionInLine || 0,
          entries: res.data.entries || [],
          departmentQueues: res.data.departmentQueues || {}
        });
      }
    } catch (err) {
      console.warn('Queue fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceQueue = async () => {
    try {
      const res = await axios.post(`${API_BASE}/care-network/queue/action`, {
        facilityId: selectedFacilityId,
        department: selectedDepartment,
        action: 'COMPLETE'
      });
      if (res.data) {
        setActionSuccess(`Consultation Completed for ${selectedDepartment}! Now serving Token #${res.data.servingToken}`);
        fetchQueueStatus(selectedFacilityId, selectedDepartment);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error advancing queue:', err);
    }
  };

  const selectedFacilityObj = facilities.find(f => f.facilityId === selectedFacilityId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER & FACILITY SELECTOR */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-black uppercase">
              <Building2 className="w-4 h-4" />
              <span>Hospital & PHC Staff Administration Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {selectedFacilityObj?.name || 'PRIMARY HEALTH CENTRE (PHC) KHED'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage live OPD queue tokens, doctor cabin consultations, referrals, and facility diagnostics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 min-w-[320px]">
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hospital Facility:</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                {facilities.map(f => (
                  <option key={f.facilityId} value={f.facilityId}>
                    {f.name} ({f.facilityType})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Active Doctor OPD Cabin:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-extrabold text-indigo-700 dark:text-indigo-300"
              >
                {OPD_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* DOCTOR CABIN LIVE OPD QUEUE CONTROL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
              <UserCheck className="w-4 h-4" />
              <span>Doctor Cabin OPD Consultation Control • {selectedDepartment.toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-black mt-1">CURRENTLY CONSULTING IN {selectedDepartment.toUpperCase()} CABIN</h2>
          </div>

          <button
            onClick={handleAdvanceQueue}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Consultation & Call Next Patient (+1)</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl">
            ✓ {actionSuccess}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400">NOW SERVING TOKEN</span>
            <p className="text-3xl font-black text-emerald-400">#{queueData.currentToken}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400">TOTAL BOOKED TODAY</span>
            <p className="text-3xl font-black text-amber-400">#{queueData.totalTokensBooked}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400">WAITING PATIENTS</span>
            <p className="text-3xl font-black text-cyan-300">{Math.max(0, queueData.totalTokensBooked - queueData.currentToken)}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase text-slate-400">EST. AVG CONSULT TIME</span>
            <p className="text-3xl font-black text-purple-300">15 - 20 Mins</p>
          </div>
        </div>
      </div>

      {/* OPD SECTIONS REAL-TIME QUEUE SUMMARY */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>All OPD Sections Live Queues ({selectedFacilityObj?.name || 'Selected Facility'})</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
            ● Real-Time Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {OPD_DEPARTMENTS.map(dept => {
            const qInfo = queueData.departmentQueues?.[dept] || { currentToken: 1, totalTokensBooked: 0, waitingCount: 0 };
            const isSelected = selectedDepartment === dept;
            return (
              <div
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 shadow-md ring-2 ring-indigo-400/40'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-slate-900 dark:text-white truncate">{dept}</span>
                  {isSelected && <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Now Serving</span>
                    <p className="font-black text-emerald-600 text-base">#{qInfo.currentToken}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Booked Today</span>
                    <p className="font-black text-amber-500 text-base">#{qInfo.totalTokensBooked}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TODAY'S STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Patients</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{queueData.totalTokensBooked || 12}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Waiting in Queue</span>
          <p className="text-2xl font-black text-amber-500">{Math.max(0, queueData.totalTokensBooked - queueData.currentToken)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <GitMerge className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Referrals</span>
          <p className="text-2xl font-black text-purple-600">8</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <ShieldAlert className="w-5 h-5 text-rose-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Alerts</span>
          <p className="text-2xl font-black text-rose-600">3</p>
        </div>
      </div>

      {/* HOSPITAL SERVICES & MEDICINE MANAGEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIAGNOSTIC SERVICES STATUS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <span>Facility Diagnostic Capabilities</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">ECG Unit</span>
              <span className="font-bold text-emerald-600">✓ ACTIVE (Wait: 10m)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Pathology & Blood Test</span>
              <span className="font-bold text-emerald-600">✓ ACTIVE (Wait: 15m)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">X-Ray Department</span>
              <span className="font-bold text-rose-500">✕ Out of Service</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Teleconsultation Hub</span>
              <span className="font-bold text-blue-600">✓ ACTIVE</span>
            </div>
          </div>
        </div>

        {/* MEDICINE STOCK STATUS */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-500" />
            <span>Facility Pharmacy Stock</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Paracetamol 500mg</span>
              <span className="font-bold text-emerald-600">250 Units Stock</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Metformin 500mg</span>
              <span className="font-bold text-emerald-600">120 Units Stock</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Amoxicillin 500mg</span>
              <span className="font-bold text-amber-600">80 Units (Low Stock)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <span className="font-bold">Oral Rehydration Salts (ORS)</span>
              <span className="font-bold text-emerald-600">500 Units Stock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortalPage;
