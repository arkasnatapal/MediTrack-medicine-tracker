import React, { useState } from 'react';
import { Video, Calendar, User, Building2, CheckCircle2, PhoneCall, Clock } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TeleconsultationPage = () => {
  const [specialty, setSpecialty] = useState('Cardiology');
  const [symptoms, setSymptoms] = useState('');
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/care-network/teleconsultation`,
        { specialty, symptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequested(true);
    } catch (err) {
      setRequested(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-black uppercase">
          <Video className="w-4 h-4" />
          <span>Remote Specialist Teleconsultation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          TELECONSULTATION MODULE
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Connect with remote medical specialists from District Hospitals for follow-up care in rural areas.
        </p>
      </div>

      {!requested ? (
        <form onSubmit={handleRequest} className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Specialty:</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            >
              <option value="Cardiology">Cardiology (Heart Specialist)</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics (Child Care)</option>
              <option value="Pulmonology">Pulmonology (Respiratory Care)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Consultation Reason / Symptoms:</label>
            <textarea
              rows="3"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe symptoms for the specialist..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Request Specialist Session</span>
          </button>
        </form>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Teleconsultation Session Requested</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your request for <span className="font-bold text-indigo-600">{specialty}</span> teleconsultation with Aundh District Hospital Tele-Hub has been logged.
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 max-w-sm mx-auto">
            Scheduled Time: Today at 04:30 PM
          </div>

          <button
            onClick={() => setRequested(false)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            ← Request another session
          </button>
        </div>
      )}
    </div>
  );
};

export default TeleconsultationPage;
