import React, { useState, useEffect } from 'react';
import { Building2, Users, Clock, GitMerge, ShieldAlert, Activity, Pill, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HospitalPortalPage = () => {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const res = await axios.get(`${API_BASE}/care-network/hospital-portal/FAC-MH-PUNE-PHC-01`);
        if (res.data) {
          setPortalData(res.data);
        }
      } catch (err) {
        console.error('Error fetching portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortal();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-black uppercase">
          <Building2 className="w-4 h-4" />
          <span>Hospital & PHC Staff Administration Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          PRIMARY HEALTH CENTRE (PHC) KHED PORTAL
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage live OPD queue tokens, incoming referrals, diagnostic availability, and local medicine stock.
        </p>
      </div>

      {/* TODAY'S STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Patients</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{portalData?.stats?.todayPatients || 128}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Waiting in Queue</span>
          <p className="text-2xl font-black text-amber-500">{portalData?.stats?.waitingInQueue || 14}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <GitMerge className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Referrals</span>
          <p className="text-2xl font-black text-purple-600">{portalData?.stats?.activeReferrals || 8}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <ShieldAlert className="w-5 h-5 text-rose-600 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Alerts</span>
          <p className="text-2xl font-black text-rose-600">{portalData?.stats?.emergencyAlerts || 3}</p>
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
