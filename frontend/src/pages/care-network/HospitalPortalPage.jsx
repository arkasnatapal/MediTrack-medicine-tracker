import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Clock, GitMerge, ShieldAlert, Activity, Pill, CheckCircle2, RefreshCw, UserCheck, Calendar, Download, Play, Pause, XCircle, AlertTriangle, Printer } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CARE_API_BASE = import.meta.env.VITE_CARE_API_BASE_URL || 'http://localhost:5001/api';

const HospitalPortalPage = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('FAC-MH-PUNE-PHC-01');
  const [selectedDepartment, setSelectedDepartment] = useState('General OPD');
  const [activeReferralsCount, setActiveReferralsCount] = useState(0);
  
  const [queueData, setQueueData] = useState({
    currentToken: 1,
    totalTokensBooked: 1,
    positionInLine: 0,
    entries: [],
    departmentQueues: {},
    opdStatus: 'OPEN',
    opdStatusObj: { opdStatus: 'OPEN', registrationOpen: true, reason: 'OPD is open' },
    scheduleConfig: null,
    waitDisplayText: '~15 Mins'
  });

  const [opdScheduleForm, setOpdScheduleForm] = useState({
    openTime: '09:00',
    closeTime: '13:00',
    breakStart: '11:30',
    breakEnd: '12:00',
    lastTokenTime: '12:30',
    closingWarningMinutes: 30,
    queueMode: 'SHARED_QUEUE'
  });

  const [doctorAttendanceList, setDoctorAttendanceList] = useState([]);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);

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
    fetchReferralsCount();
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      fetchQueueStatus(selectedFacilityId, selectedDepartment);
      fetchDoctorAttendance(selectedFacilityId);
    }
  }, [selectedFacilityId, selectedDepartment]);

  useEffect(() => {
    if (!selectedFacilityId) return;
    const interval = setInterval(() => {
      fetchQueueStatus(selectedFacilityId, selectedDepartment);
      fetchReferralsCount();
      fetchDoctorAttendance(selectedFacilityId);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedFacilityId, selectedDepartment]);

  const fetchReferralsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/referrals/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && Array.isArray(res.data.referrals)) {
        setActiveReferralsCount(res.data.referrals.length);
      }
    } catch (err) {
      console.warn('Error fetching referral count:', err);
    }
  };

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
          departmentQueues: res.data.departmentQueues || {},
          opdStatus: res.data.opdStatus || 'OPEN',
          opdStatusObj: res.data.opdStatusObj || { opdStatus: 'OPEN', registrationOpen: true, reason: 'OPD is open' },
          scheduleConfig: res.data.scheduleConfig || null,
          waitDisplayText: res.data.waitDisplayText || '~15 Mins'
        });

        if (res.data.scheduleConfig) {
          setOpdScheduleForm({
            openTime: res.data.scheduleConfig.openTime || '09:00',
            closeTime: res.data.scheduleConfig.closeTime || '13:00',
            breakStart: res.data.scheduleConfig.breakStart || '11:30',
            breakEnd: res.data.scheduleConfig.breakEnd || '12:00',
            lastTokenTime: res.data.scheduleConfig.lastTokenTime || '12:30',
            closingWarningMinutes: res.data.scheduleConfig.closingWarningMinutes || 30,
            queueMode: res.data.scheduleConfig.queueMode || 'SHARED_QUEUE'
          });
        }
      }
    } catch (err) {
      console.warn('Queue fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAttendance = async (facId) => {
    try {
      const res = await axios.get(`${CARE_API_BASE}/doctors/attendance?facilityId=${facId}`);
      if (Array.isArray(res.data)) {
        setDoctorAttendanceList(res.data);
      }
    } catch (err) {}
  };

  const handleSaveOpdSchedule = async (e) => {
    e.preventDefault();
    try {
      setSavingSchedule(true);
      const token = localStorage.getItem('care_token') || localStorage.getItem('token');
      await axios.post(`${CARE_API_BASE}/queues/opd-schedule`, {
        facilityId: selectedFacilityId,
        department: selectedDepartment,
        ...opdScheduleForm
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setActionSuccess(`OPD Operating Schedule for ${selectedDepartment} saved successfully!`);
      fetchQueueStatus(selectedFacilityId, selectedDepartment);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save OPD schedule configuration');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleManualOpdAction = async (action) => {
    try {
      const token = localStorage.getItem('care_token') || localStorage.getItem('token');
      const res = await axios.post(`${CARE_API_BASE}/queues/opd-status`, {
        facilityId: selectedFacilityId,
        department: selectedDepartment,
        action
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data) {
        setActionSuccess(`OPD Manual Status updated to ${res.data.opdStatusObj?.opdStatus || action}`);
        fetchQueueStatus(selectedFacilityId, selectedDepartment);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update OPD status');
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

  const handleExportAttendanceCsv = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const url = `${CARE_API_BASE}/doctors/attendance-csv?facilityId=${selectedFacilityId}&date=${todayStr}`;
    window.open(url, '_blank');
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
              <span>Hospital &amp; PHC Operations Control Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {selectedFacilityObj?.name || 'PRIMARY HEALTH CENTRE (PHC) KHED'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Hospital OPD Schedule, Doctor Availability, Daily Shift Attendance, and Real-Time Token Operations.
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

      {/* AUTHORITATIVE OPD STATUS & HOSPITAL TIMING CONTROLS */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                OPD Schedule, Operating Hours &amp; Live Status ({selectedDepartment})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hospital-controlled opening time, closing time, break duration, and registration cutoff rules.
              </p>
            </div>
          </div>

          {/* OPD STATUS BADGE */}
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono text-xs font-black uppercase ${
            queueData.opdStatus === 'OPEN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' :
            queueData.opdStatus === 'BREAK' || queueData.opdStatus === 'CLOSING_SOON' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' :
            'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${queueData.opdStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : queueData.opdStatus === 'BREAK' ? 'bg-amber-500' : 'bg-rose-500'}`} />
            <span>OPD STATUS: {queueData.opdStatus?.replace('_', ' ')}</span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* TIMING CONFIGURATION FORM & MANUAL CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSaveOpdSchedule} className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Opening Time</label>
              <input
                type="time"
                value={opdScheduleForm.openTime}
                onChange={(e) => setOpdScheduleForm(prev => ({ ...prev, openTime: e.target.value }))}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Closing Time</label>
              <input
                type="time"
                value={opdScheduleForm.closeTime}
                onChange={(e) => setOpdScheduleForm(prev => ({ ...prev, closeTime: e.target.value }))}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Last Token Cutoff</label>
              <input
                type="time"
                value={opdScheduleForm.lastTokenTime}
                onChange={(e) => setOpdScheduleForm(prev => ({ ...prev, lastTokenTime: e.target.value }))}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Break Start</label>
              <input
                type="time"
                value={opdScheduleForm.breakStart}
                onChange={(e) => setOpdScheduleForm(prev => ({ ...prev, breakStart: e.target.value }))}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Break End</label>
              <input
                type="time"
                value={opdScheduleForm.breakEnd}
                onChange={(e) => setOpdScheduleForm(prev => ({ ...prev, breakEnd: e.target.value }))}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingSchedule}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                {savingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>

          {/* HOSPITAL MANUAL OVERRIDE CONTROLS */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 flex flex-col justify-between">
            <span className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Hospital Operational Controls</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleManualOpdAction('OPEN')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow transition ${
                  queueData.opdStatus === 'OPEN'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-[1.02]'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Play className="w-3.5 h-3.5" /> Open OPD
              </button>

              <button
                type="button"
                onClick={() => handleManualOpdAction('PAUSE')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow transition ${
                  queueData.opdStatus === 'PAUSED'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400 scale-[1.02]'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                <Pause className="w-3.5 h-3.5" /> Pause Queue
              </button>

              <button
                type="button"
                onClick={() => handleManualOpdAction('CLOSE_REGISTRATION')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow transition ${
                  queueData.opdStatus === 'REGISTRATION_CLOSED'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400 scale-[1.02]'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" /> Stop Reg.
              </button>

              <button
                type="button"
                onClick={() => handleManualOpdAction('CLOSE')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow transition ${
                  queueData.opdStatus === 'CLOSED'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-[1.02]'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" /> Close OPD
              </button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Active: <strong className="uppercase font-mono text-slate-800 dark:text-white">{queueData.opdStatus || 'OPEN'}</strong></p>
              <button
                type="button"
                onClick={() => handleManualOpdAction('AUTO')}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-mono font-bold hover:underline"
              >
                Reset Auto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DOCTOR CABIN LIVE OPD QUEUE CONTROL */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-slate-50/90 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl space-y-6 border border-indigo-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-transparent text-xs font-bold uppercase">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Doctor Cabin OPD Consultation Control • {selectedDepartment.toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-black mt-1 text-slate-900 dark:text-white">CURRENTLY CONSULTING IN {selectedDepartment.toUpperCase()} CABIN</h2>
          </div>

          <button
            onClick={handleAdvanceQueue}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Consultation &amp; Call Next Patient (+1)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-indigo-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">NOW SERVING TOKEN</span>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">#{queueData.currentToken}</p>
          </div>

          <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-indigo-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">TOTAL BOOKED TODAY</span>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-400">#{queueData.totalTokensBooked}</p>
          </div>

          <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-indigo-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">WAITING PATIENTS</span>
            <p className="text-3xl font-black text-cyan-800 dark:text-cyan-300">{Math.max(0, queueData.totalTokensBooked - queueData.currentToken)}</p>
          </div>

          <div className="bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-indigo-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">ESTIMATED WAIT</span>
            <p className="text-2xl font-black text-purple-800 dark:text-purple-300">{queueData.waitDisplayText || '~15 Mins'}</p>
          </div>
        </div>
      </div>

      {/* DOCTOR DAILY SHIFT ATTENDANCE & CSV EXPORT */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Doctor Daily Shift Attendance Datasheet</h2>
          </div>

          <button
            onClick={handleExportAttendanceCsv}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow flex items-center gap-2 self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Export Printable Attendance (.CSV)</span>
          </button>
        </div>

        {doctorAttendanceList.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            No doctor check-in logs recorded for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2 px-2">Doctor Name</th>
                  <th className="pb-2 px-2">Department</th>
                  <th className="pb-2 px-2">In-Time</th>
                  <th className="pb-2 px-2">Out-Time / Terminated</th>
                  <th className="pb-2 px-2">Shift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {doctorAttendanceList.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">{a.doctorId?.fullName || 'Dr. Specialist'}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-500">{a.department}</td>
                    <td className="py-2.5 px-2 font-mono text-teal-600 dark:text-teal-400">{a.inTime ? new Date(a.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-400">{a.outTime ? new Date(a.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        a.status === 'AVAILABLE' || a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        a.status === 'ON_BREAK' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
};

export default HospitalPortalPage;
