import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milestone, CheckCircle2, Clock, Calendar, Activity, GitMerge, Pill, Stethoscope, Video, Sparkles, ChevronRight, Play, FileText, Download, X, ExternalLink, User, ChevronDown, ChevronUp, Ticket, RefreshCw } from 'lucide-react';
import axios from 'axios';
import useRealtimeSync from '../../hooks/useRealtimeSync';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareJourneyPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  // Active OPD Appointments & Queue Live Widget State
  const [activeAppointments, setActiveAppointments] = useState([]);
  const [queueDataMap, setQueueDataMap] = useState({});
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload._id || payload.id;
    } catch (e) {
      return null;
    }
  };
  const currentUserId = getUserIdFromToken();

  useRealtimeSync({
    channels: [
      'global',
      currentUserId ? `patient:${currentUserId}` : null,
      currentUserId ? `user:${currentUserId}` : null,
    ].filter(Boolean),
    onEvent: (eventPayload) => {
      console.log('⚡ Realtime Event in CareJourneyPage:', eventPayload);
      fetchCareJourney();
      fetchPrescriptions();
      fetchActiveAppointmentsAndQueues();
    },
    onReconnectRefetch: () => {
      fetchCareJourney();
      fetchPrescriptions();
      fetchActiveAppointmentsAndQueues();
    }
  });

  useEffect(() => {
    fetchCareJourney();
    fetchPrescriptions();
    fetchActiveAppointmentsAndQueues();
  }, []);

  useEffect(() => {
    if (!activeAppointments || activeAppointments.length === 0) return;
    const interval = setInterval(() => {
      fetchActiveAppointmentsAndQueues();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeAppointments]);

  const fetchActiveAppointmentsAndQueues = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/appointments/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data && res.data.appointments) {
        const activeOnly = res.data.appointments.filter(
          a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
        );
        setActiveAppointments(activeOnly);

        const newMap = {};
        for (const apt of activeOnly) {
          const aptKey = apt.appointmentId || apt._id;
          const facId = apt.facilityId || 'FAC-DEFAULT';
          const dept = apt.department || 'General OPD';
          const userAptToken = apt.tokenNumber || 0;
          try {
            const qRes = await axios.get(`${API_BASE}/care-network/queue/${facId}?department=${encodeURIComponent(dept)}&tokenNumber=${userAptToken || ''}`);
            if (qRes.data && qRes.data.success) {
              newMap[aptKey] = {
                userToken: userAptToken > 0 ? (qRes.data.userToken || userAptToken) : 0,
                currentToken: qRes.data.currentToken || 0,
                positionInLine: userAptToken > 0 ? (qRes.data.positionInLine !== undefined ? qRes.data.positionInLine : Math.max(0, userAptToken - (qRes.data.currentToken || 1))) : 0,
                estimatedWaitMinutes: userAptToken > 0 ? (qRes.data.estimatedWaitMinutes || 0) : 0,
                currentPatientRemainingMinutes: qRes.data.currentPatientRemainingMinutes || 7,
                averageConsultationMinutes: qRes.data.averageConsultationMinutes || 7
              };
            }
          } catch (qErr) {
            newMap[aptKey] = {
              userToken: userAptToken,
              currentToken: 1,
              positionInLine: userAptToken > 0 ? Math.max(0, userAptToken - 1) : 0,
              estimatedWaitMinutes: userAptToken > 0 ? Math.max(0, userAptToken - 1) * 7 : 0
            };
          }
        }
        setQueueDataMap(newMap);
      }
    } catch (err) {
      console.warn('Error fetching active appointments for care journey:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

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

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/prescriptions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.prescriptions) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      console.warn('Error fetching prescriptions:', err.message);
    }
  };

  const openPdfDocument = (pdfDataUrl) => {
    if (!pdfDataUrl) {
      return alert('PDF document URL not available for this record.');
    }
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${pdfDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      alert('Please allow popups to view the PDF prescription.');
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
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-slate-50/90 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-6 sm:p-8 rounded-3xl text-slate-900 dark:text-white shadow-xl border border-blue-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300/60 dark:border-transparent text-xs font-black uppercase">
              <Milestone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Longitudinal Continuity of Care</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">MY CARE JOURNEY</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Track your connected healthcare journey from symptom triage to specialist consultation and follow-up.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPrescriptionsModal(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 border border-teal-400/30"
            >
              <Pill className="w-4 h-4" />
              <span>💊 My Prescriptions ({prescriptions.length})</span>
            </button>

            <button
              onClick={() => navigate('/care-network/triage')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Hackathon Demo Journey</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE OPD QUEUE & APPOINTMENTS OVERVIEW LIVE WIDGET */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-indigo-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Ticket className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">ACTIVE OPD APPOINTMENTS &amp; LIVE QUEUE MONITOR</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase font-mono flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Live token status, people ahead &amp; estimated wait time</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchActiveAppointmentsAndQueues}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingAppointments ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            <button
              onClick={() => navigate('/care-network/appointments')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition"
            >
              <span>Book / Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {activeAppointments.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <Clock className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">No active OPD appointments currently in queue.</p>
            <p className="text-[11px] text-slate-500">Book an appointment at a nearby public healthcare facility to monitor your live token status, people ahead, and estimated wait time here.</p>
            <button
              onClick={() => navigate('/care-network/appointments')}
              className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
            >
              Book OPD Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAppointments.map(apt => {
              const aptKey = apt.appointmentId || apt._id;
              const qInfo = queueDataMap[aptKey] || {
                userToken: apt.tokenNumber || 0,
                currentToken: 1,
                positionInLine: Math.max(0, (apt.tokenNumber || 1) - 1),
                estimatedWaitMinutes: Math.max(0, (apt.tokenNumber || 1) - 1) * 7
              };

              const userToken = apt.tokenNumber || qInfo.userToken || 0;
              const currentToken = qInfo.currentToken || 1;
              const peopleAhead = qInfo.positionInLine !== undefined ? qInfo.positionInLine : Math.max(0, userToken - currentToken);
              const estWait = qInfo.estimatedWaitMinutes || 0;

              const isPending = apt.status === 'PENDING_APPROVAL' || apt.status === 'REQUESTED' || apt.status === 'BOOKED';
              const isConfirmed = apt.status === 'CONFIRMED';
              const isCheckedIn = apt.status === 'CHECKED_IN';
              const isConsulting = apt.status === 'IN_CONSULTATION';

              return (
                <div
                  key={aptKey}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg hover:border-cyan-500/50 transition relative overflow-hidden group"
                >
                  {/* Top Bar: Hospital & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {apt.facilityName || 'Healthcare Center'}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-400 font-semibold">
                        Department: {apt.department || 'General OPD'}
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                      isConfirmed ? 'bg-blue-600 text-white shadow-sm border border-blue-400 font-black' :
                      isCheckedIn ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' :
                      isConsulting ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}>
                      {isPending ? '⏳ Awaiting Hospital Permission' : isConfirmed ? '✓ CONFIRMED' : apt.status}
                    </span>
                  </div>

                  {/* 4 Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">YOUR TOKEN</span>
                      <span className="text-lg font-black text-white font-mono">#{userToken || '--'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">NOW SERVING</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">#{currentToken}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">PEOPLE AHEAD</span>
                      <span className="text-lg font-black text-amber-300 font-mono">{peopleAhead}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">ESTIMATED WAIT</span>
                      <span className="text-lg font-black text-cyan-300 font-mono">
                        {peopleAhead === 0 && userToken > 0 ? "0 / Next" : `~${estWait}m`}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Doctor & Time slot info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      <span>Doctor: <strong className="text-slate-200">{apt.doctorName || 'Duty Medical Officer'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Slot: <strong className="text-slate-200">{apt.time || apt.timeSlot || '09:30 AM'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* PRESCRIPTIONS HUB MODAL */}
      {showPrescriptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Clinical OPD Prescriptions Hub</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Stored medical prescriptions issued across your Care Journey</p>
                </div>
              </div>
              <button onClick={() => setShowPrescriptionsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No OPD prescriptions recorded yet.</p>
                <p className="text-[11px]">Prescriptions issued by doctors during consultations will automatically store here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((p, idx) => {
                  const cardId = p._id || `rx-cj-${idx}`;
                  const isExpanded = !!expandedCards[cardId];
                  const medCount = p.medicines ? p.medicines.length : 0;
                  const toggleExpand = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

                  return (
                    <div key={cardId} className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition hover:border-teal-500/40">
                      {/* Compact Header */}
                      <div
                        onClick={() => toggleExpand(cardId)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold flex-shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{p.facilityName}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${p.isOfflinePrescription ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'}`}>
                                {p.isOfflinePrescription ? '📋 Offline Handwritten' : '📄 Digital PDF'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                              <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                Dr. {p.doctorName || 'Specialist'}
                              </span>
                              <span>•</span>
                              <span>{p.date}</span>
                              {p.diagnosis && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-900 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                    {p.diagnosis}
                                  </span>
                                </>
                              )}
                              {medCount > 0 && (
                                <span className="text-[11px] font-bold text-slate-400">
                                  ({medCount} meds)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                          {p.pdfDataUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPdfDocument(p.pdfDataUrl);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </button>
                          )}

                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 text-xs font-bold">
                            <span className="text-[11px]">{isExpanded ? 'Less' : 'Details'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-teal-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 animate-in fade-in duration-150">
                          <div className="flex justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span>Dept: <strong className="text-slate-800 dark:text-white">{p.department || 'General OPD'}</strong></span>
                            <span>Token #: <strong className="text-amber-600 dark:text-amber-400">#{p.tokenNumber || 1}</strong></span>
                          </div>

                          {p.diagnosis && (
                            <div className="text-xs">
                              <span className="font-bold text-slate-400 uppercase text-[10px] block">Diagnosis</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{p.diagnosis}</span>
                            </div>
                          )}

                          {p.medicines && p.medicines.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-400 uppercase text-[10px] block">Prescribed Medicines ({p.medicines.length})</span>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                                  <thead>
                                    <tr className="bg-slate-200/60 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                                      <th className="p-2">Medicine</th>
                                      <th className="p-2">Dosage</th>
                                      <th className="p-2">Frequency</th>
                                      <th className="p-2">Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {p.medicines.map((m, mIdx) => (
                                      <tr key={mIdx}>
                                        <td className="p-2 font-bold text-slate-900 dark:text-white">{m.name || 'Medicine'}</td>
                                        <td className="p-2">{m.dosage || '-'}</td>
                                        <td className="p-2 font-semibold text-teal-600 dark:text-teal-400">{m.frequency || '-'}</td>
                                        <td className="p-2">{m.duration || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {p.advice && (
                            <div className="text-xs bg-slate-100 dark:bg-slate-950 p-3 rounded-xl">
                              <span className="font-bold text-slate-400 uppercase text-[10px] block">Doctor Advice</span>
                              <span className="text-slate-700 dark:text-slate-300 italic">"{p.advice}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareJourneyPage;

