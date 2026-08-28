import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milestone, CheckCircle2, Clock, Calendar, Activity, GitMerge, Pill, Stethoscope, Video, Sparkles, ChevronRight, Play } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareJourneyPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetchCareJourney();
  }, []);

  const fetchCareJourney = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/care-journey`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.events) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error fetching care journey:', err);
    } finally {
      setLoading(false);
    }
  };

  const demoStoryTimeline = [
    {
      title: '1. Symptom Intake & Digital Triage',
      type: 'TRIAGE',
      facility: 'MediTrack AI Triage Engine',
      desc: 'Patient reported chest pain and shortness of breath. Urgency classified as HIGH PRIORITY.',
      status: 'COMPLETED',
      icon: Stethoscope,
      time: 'Day 1 • 09:00 AM'
    },
    {
      title: '2. Emergency 108 Guidance & Facility Routing',
      type: 'EMERGENCY',
      facility: 'Emergency Healthcare MEMS 108 / Local Public Health Centre',
      desc: 'Location acquired. OSRM driving route calculated to nearest emergency equipped facility.',
      status: 'COMPLETED',
      icon: Milestone,
      time: 'Day 1 • 09:15 AM'
    },
    {
      title: '3. Token #37 OPD Appointment & Queue',
      type: 'APPOINTMENT',
      facility: 'Primary Health Centre (PHC) Sadar',
      desc: 'Token #37 issued. Live position in line #5 monitored until OPD consultation.',
      status: 'COMPLETED',
      icon: Calendar,
      time: 'Day 1 • 10:00 AM'
    },
    {
      title: '4. Clinical Evaluation & ECG Diagnostic',
      type: 'DIAGNOSTIC',
      facility: 'Primary Health Centre (PHC) Khed',
      desc: 'ECG diagnostic performed at PHC unit. Preliminary ST-elevation observed.',
      status: 'COMPLETED',
      icon: Activity,
      time: 'Day 1 • 10:30 AM'
    },
    {
      title: '5. Priority Referral to District Hospital Cardiology',
      type: 'REFERRAL',
      facility: 'Aundh District Hospital Pune',
      desc: 'Urgent referral generated from PHC Khed to District Hospital Cardiology.',
      status: 'COMPLETED',
      icon: GitMerge,
      time: 'Day 1 • 11:15 AM'
    },
    {
      title: '6. Medicine Inventory Check & Dispensing',
      type: 'MEDICINE',
      facility: 'Aundh District Hospital Pharmacy',
      desc: 'Metformin 500mg, Atorvastatin 20mg & Aspirin 75mg issued from verified local stock.',
      status: 'COMPLETED',
      icon: Pill,
      time: 'Day 2 • 02:00 PM'
    },
    {
      title: '7. Specialist Teleconsultation & Follow-up',
      type: 'TELECONSULTATION',
      facility: 'Aundh District Hospital Tele-Hub',
      desc: 'Remote teleconsultation scheduled with Chief Cardiologist for recovery tracking.',
      status: 'IN_PROGRESS',
      icon: Video,
      time: 'Today • 04:30 PM'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase">
              <Milestone className="w-4 h-4" />
              <span>Longitudinal Continuity of Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">MY CARE JOURNEY</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Track your connected healthcare journey from symptom triage to specialist consultation and follow-up.
            </p>
          </div>

          <button
            onClick={() => navigate('/care-network/triage')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>SIH Hackathon Demo Journey</span>
          </button>
        </div>
      </div>

      {/* TIMELINE TREE */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-8">
        <div className="relative border-l-2 border-blue-500/40 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8">
          {demoStoryTimeline.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'COMPLETED';
            return (
              <div key={idx} className="relative group">
                {/* TIMELINE NODE ICON */}
                <div className={`absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 shadow-md ${
                  isCompleted
                    ? 'bg-blue-600 border-white text-white'
                    : 'bg-amber-500 border-white text-white animate-pulse'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* STEP CARD */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 hover:border-blue-400 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {step.time}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    🏥 {step.facility}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {step.desc}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[10px] font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full ${
                      isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isCompleted ? '✓ VERIFIED STEP' : '◉ IN PROGRESS'}
                    </span>
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

export default CareJourneyPage;
