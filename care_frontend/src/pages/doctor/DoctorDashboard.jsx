import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Stethoscope, Calendar, Clock, UserCheck, Video, VideoOff, Mic, MicOff, FileText, Building2,
  PhoneOff, RefreshCw, Send, CheckCircle2, AlertCircle, Plus, ShieldCheck,
  LogOut, MessageSquare, UserPlus, Filter, Check, ArrowRight, ShieldAlert,
  Mail, Phone, Info, Award, Radio, Trash2, Maximize2, Minimize2, Volume2
} from 'lucide-react';
import LiveKitCallModal from '../../components/calling/LiveKitCallModal';


export default function DoctorDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(false);

  // Clinical Data States
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [teleSessions, setTeleSessions] = useState([]);
  const [facilities, setFacilities] = useState([]);

  // Filter States
  const [appointmentFilter, setAppointmentFilter] = useState('ALL');
  const [referralFilter, setReferralFilter] = useState('ALL');

  // Active Teleconsultation Session
  const [activeTeleSession, setActiveTeleSession] = useState(null);
  const [callEndedState, setCallEndedState] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [mediaMode, setMediaMode] = useState('VIDEO');
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [modeSwitchToast, setModeSwitchToast] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inSessionChat, setInSessionChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [postMessages, setPostMessages] = useState([]);
  const [postMessagesLeft, setPostMessagesLeft] = useState(10);
  const [doctorReplyText, setDoctorReplyText] = useState('');
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);

  // LiveKit Call Modal States
  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [liveKitRoomName, setLiveKitRoomName] = useState('');
  const [liveKitCallType, setLiveKitCallType] = useState('VIDEO');

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoContainerRef = useRef(null);


  const formatDoctorName = (name) => {
    if (!name) return 'Dr. Specialist';
    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
  };

  // Prescription Form State
  const [prescriptionForm, setPrescriptionForm] = useState({
    appointmentId: '',
    diagnosis: '',
    medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5 days' }],
    advice: 'Drink plenty of warm fluids & rest adequately.',
  });

  // Facility Association Request Form State
  const [associationForm, setAssociationForm] = useState({
    facilityId: '',
    department: 'Cardiology Specialist OPD',
    designation: 'Visiting Specialist Consultant',
    employmentType: 'PART_TIME',
  });

  // Create Referral Form State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralForm, setReferralForm] = useState({
    patientId: '',
    receivingFacilityId: '',
    department: 'Cardiothoracic Surgery',
    urgency: 'URGENT',
    reason: 'Specialist surgical evaluation required',
    clinicalNotes: 'ECG shows ischemic changes in anterior leads.',
    requestedServices: 'Echocardiography, Coronary Angiography',
  });

  const doctorId = user?.doctor?._id || user?.doctorId?._id || user?.doctorId;

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/appointments', { params: { doctorId } }),
        api.get('/referrals'),
        api.get('/facility-doctors', { params: { doctorId } }),
        api.get('/teleconsultations', { params: { doctorId } }),
        api.get('/queues', { params: { doctorId } }),
        api.get('/facilities'),
      ]);

      const [appRes, refRes, assocRes, teleRes, qRes, facRes] = results;

      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data || []);
      if (refRes.status === 'fulfilled') setReferrals(refRes.value.data || []);
      if (assocRes.status === 'fulfilled') setAssociations(assocRes.value.data || []);
      if (facRes.status === 'fulfilled' && facRes.value.data) {
        setFacilities(facRes.value.data || []);
        if (facRes.value.data.length > 0 && !associationForm.facilityId) {
          setAssociationForm(prev => ({ ...prev, facilityId: facRes.value.data[0]._id }));
          setReferralForm(prev => ({ ...prev, receivingFacilityId: facRes.value.data[0]._id }));
        }
      }
      if (qRes.status === 'fulfilled' && qRes.value.data) {
        setQueue(qRes.value.data);
      }

      let fetchedTeles = teleRes.status === 'fulfilled' ? (teleRes.value.data || []) : [];
      
      // Fallback: If no teleconsultation sessions found specifically for doctorId, fetch all care network teleconsultations
      if (fetchedTeles.length === 0) {
        try {
          const allTeleRes = await api.get('/teleconsultations');
          fetchedTeles = allTeleRes.data || [];
        } catch (e) {
          console.warn('Fallback teleconsultations fetch failed:', e);
        }
      }
      setTeleSessions(fetchedTeles);

      if (fetchedTeles.length > 0 && !activeTeleSession) {
        const confirmedOrLatest = fetchedTeles.find(s => s.status === 'CONFIRMED' || s.status === 'ACTIVE') || fetchedTeles[0];
        setActiveTeleSession(confirmedOrLatest);
        setPostMessages(confirmedOrLatest.postSessionMessages || []);
        setPostMessagesLeft(confirmedOrLatest.postSessionMessagesLeft ?? 10);
      }
    } catch (err) {
      console.error('Failed to load doctor clinical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [user]);

  // Stop Call State
  const stopDoctorCallState = () => {
    setInCall(false);
    setShowLiveKitModal(false);
  };


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current?.requestFullscreen) {
        videoContainerRef.current.requestFullscreen().catch(err => {
          console.warn('Fullscreen error:', err);
          setIsFullscreen(prev => !prev);
        });
      } else {
        setIsFullscreen(prev => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Toggle Doctor Mic
  const toggleDoctorMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  // Toggle Doctor Video
  const toggleDoctorVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  // Switch Doctor Media Mode (VIDEO vs VOICE_ONLY)
  const handleSwitchDoctorMediaMode = (newMode) => {
    setMediaMode(newMode);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = (newMode === 'VIDEO'));
    }
    if (socketRef.current && activeTeleSession) {
      socketRef.current.emit('switch_media_mode', {
        roomId: `telecon:${activeTeleSession.meetingIdentifier}`,
        mode: newMode,
        senderName: formatDoctorName(user?.doctor?.fullName || user?.name || 'Doctor'),
      });
    }
  };

  // Queue Action Controller (NEXT PATIENT / COMPLETE)
  const handleQueueAction = async (action, tokenNumber) => {
    if (!queue) return;
    try {
      const res = await api.post('/queues/action', {
        queueId: queue._id,
        action,
        tokenNumber,
      });
      setQueue(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Queue action failed');
    }
  };

  // Doctor Launches Teleconsultation Call via LiveKit
  const handleStartCall = async (sessionObj) => {
    try {
      setInCall(true);
      setCallEndedState(false);
      setActiveTab('teleconsultation');

      const res = await api.put(`/teleconsultations/${sessionObj._id}/start`);
      setActiveTeleSession(res.data);

      const room = `telecon_${sessionObj.meetingIdentifier}`;
      setLiveKitRoomName(room);
      setLiveKitCallType(mediaMode || 'VIDEO');
      setShowLiveKitModal(true);
    } catch (err) {
      console.error('Failed to launch call:', err);
      alert('Failed to launch call: ' + (err.response?.data?.message || err.message));
    }
  };

  // Doctor Claims a Pending Teleconsultation Session
  const handleClaimSession = async (sessionId) => {
    try {
      const res = await api.put(`/teleconsultations/${sessionId}/claim`);
      alert(res.data.message || 'Teleconsultation claimed successfully!');
      loadDoctorData();
      setActiveTeleSession(res.data.session);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim teleconsultation');
    }
  };

  // Re-send Email Notification to Patient
  const handleResendEmail = async (sessionId, patientEmail) => {
    const emailToUse = prompt('Confirm or enter Patient Email address:', patientEmail || 'patient@example.com');
    if (!emailToUse) return;
    try {
      const res = await api.post(`/teleconsultations/${sessionId}/resend-email`, { patientEmail: emailToUse });
      alert(`Email dispatched successfully to ${emailToUse}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email');
    }
  };

  // Doctor Terminates Live Session
  const handleDoctorTerminateCall = async () => {
    if (!activeTeleSession) return;
    try {
      stopDoctorCallState();
      const res = await api.put(`/teleconsultations/${activeTeleSession._id}/terminate`, { by: 'DOCTOR' });
      setCallEndedState(true);
      setActiveTeleSession(res.data.session);

      alert('Teleconsultation session terminated by doctor! Patient has been allocated 10 post-session follow-up messages.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate call');
    }
  };

  // Doctor Clears & Stops Consultation (Marks CLOSED, notifies patient, auto-archives after 3 days, clears console)
  const handleDoctorClearAndStopConsultation = async () => {
    if (!activeTeleSession) return;
    if (!window.confirm(`Clear & Stop consultation for ${activeTeleSession.patientName}? This will close the consultation, notify the patient, and remove it from your console.`)) {
      return;
    }
    try {
      stopDoctorCallState();
      await api.put(`/teleconsultations/${activeTeleSession._id}/close`);

      alert('Consultation cleared and stopped! Patient notified.');
      setActiveTeleSession(null);
      loadDoctorData();
    } catch (err) {

      alert(err.response?.data?.message || 'Failed to clear consultation');
    }
  };

  // Doctor Delete Teleconsultation Session
  const handleDeleteDoctorSession = async (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Permanently delete this teleconsultation record from system?')) return;
    try {
      await api.delete(`/teleconsultations/${sessionId}`);
      setTeleSessions(prev => prev.filter(s => s._id !== sessionId && s.meetingIdentifier !== sessionId));
      if (activeTeleSession && (activeTeleSession._id === sessionId || activeTeleSession.meetingIdentifier === sessionId)) {
        setActiveTeleSession(null);
      }
      alert('Teleconsultation record permanently deleted.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete teleconsultation');
    }
  };

  // Doctor Sends Live In-Session Chat Message
  const handleDoctorSendInSessionChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !activeTeleSession) return;
    const textToSend = chatInput;
    setChatInput('');

    const docName = formatDoctorName(user?.doctor?.fullName || user?.name);
    socketRef.current.emit('send_in_session_chat', {
      roomId: `telecon:${activeTeleSession.meetingIdentifier}`,
      meetingIdentifier: activeTeleSession.meetingIdentifier,
      sender: docName,
      text: textToSend,
    });

    try {
      await api.post(`/teleconsultations/${activeTeleSession._id}/in-session-chat`, {
        sender: docName,
        text: textToSend,
      });
    } catch (err) {
      console.error('Failed to save in-session chat:', err);
    }
  };

  // Doctor Voice Note Clip Recorder
  const handleDoctorToggleVoiceRecorder = async () => {
    if (isRecordingVoiceNote) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecordingVoiceNote(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result;
            try {
              const res = await api.post(`/teleconsultations/${activeTeleSession._id}/post-message`, {
                sender: 'DOCTOR',
                text: '🎙️ [Doctor Voice Note Clip]',
                voiceClipUrl: base64Audio,
              });
              setPostMessages(res.data.session.postSessionMessages || []);
              alert('Voice clip message delivered to patient portal!');
            } catch (err) {
              alert('Failed to send doctor voice clip');
            }
          };
          stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setIsRecordingVoiceNote(true);
      } catch (err) {
        alert('Could not start audio recorder: ' + err.message);
      }
    }
  };

  // Send Reply to Patient Post-Session Message
  const handleDoctorSendPostReply = async (e) => {
    e.preventDefault();
    if (!doctorReplyText.trim() || !activeTeleSession) return;
    try {
      const res = await api.post(`/teleconsultations/${activeTeleSession._id}/post-message`, {
        sender: 'DOCTOR',
        text: doctorReplyText,
      });
      setPostMessages(res.data.session.postSessionMessages || []);
      setDoctorReplyText('');
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  // Submit Prescription
  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.appointmentId) return alert('Select patient appointment first');
    try {
      await api.put(`/appointments/${prescriptionForm.appointmentId}/status`, {
        status: 'COMPLETED',
        prescription: prescriptionForm,
      });
      alert('Prescription issued & saved to patient Care Journey!');
      setPrescriptionForm({
        appointmentId: '',
        diagnosis: '',
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5 days' }],
        advice: '',
      });
      loadDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Prescription issue failed');
    }
  };

  // Doctor Requests Association with a Healthcare Facility
  const handleRequestAssociation = async (e) => {
    e.preventDefault();
    if (!associationForm.facilityId) return alert('Select a facility first');
    try {
      await api.post('/facility-doctors/request', {
        facilityId: associationForm.facilityId,
        department: associationForm.department,
        designation: associationForm.designation,
        employmentType: associationForm.employmentType,
      });
      alert('Association request sent successfully to Healthcare Facility!');
      loadDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Association request failed');
    }
  };

  // Submit New Clinical Referral
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!referralForm.receivingFacilityId || !referralForm.patientId) {
      return alert('Please select a patient and receiving healthcare facility');
    }
    try {
      await api.post('/referrals', {
        patientId: referralForm.patientId,
        receivingFacilityId: referralForm.receivingFacilityId,
        department: referralForm.department,
        urgency: referralForm.urgency,
        reason: referralForm.reason,
        clinicalNotes: referralForm.clinicalNotes,
        requestedServices: referralForm.requestedServices,
      });
      alert('Clinical Referral dispatched successfully across Care Network!');
      setShowReferralModal(false);
      loadDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create referral');
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    if (appointmentFilter === 'ALL') return true;
    return a.status === appointmentFilter;
  });

  // Doctor Info
  const doctorName = user?.doctor?.fullName || user?.name || 'Dr. Rajesh Sharma';
  const doctorSpec = user?.doctor?.specialization || 'Cardiology Specialist';
  const doctorReg = user?.doctor?.medicalRegistrationNumber || 'MCI-WB-2015-8891';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white truncate max-w-[140px]">
                {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
              </h2>
              <span className="text-[10px] text-cyan-400 font-semibold block truncate">
                {doctorSpec}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'queue', label: 'Clinical Queue', icon: Clock, badge: queue?.entries?.length || 0 },
              { id: 'teleconsultation', label: 'Teleconsultation Room', icon: Video, badge: teleSessions.filter(s => s.status === 'CONFIRMED' || s.status === 'PENDING').length },
              { id: 'appointments', label: 'My Appointments', icon: Calendar, badge: appointments.length },
              { id: 'referrals', label: 'My Referrals', icon: FileText, badge: referrals.length },
              { id: 'facilities', label: 'Associated Facilities', icon: Building2, badge: associations.length },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-400 font-extrabold border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <span className="text-slate-400 block">Licence Reg:</span>
            <span className="font-mono text-cyan-400 font-bold block truncate">{doctorReg}</span>
          </div>
          <button onClick={logout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Clinical Console */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab.replace('-', ' ')} Console</h1>
            <p className="text-xs text-slate-400">
              Doctor License Reg: <strong className="text-slate-200">{doctorReg}</strong> • Specialization: <strong className="text-cyan-400">{doctorSpec}</strong>
            </p>
          </div>
          <button onClick={loadDoctorData} className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* ----------------- TAB 1: CLINICAL QUEUE ----------------- */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">CURRENTLY SERVING OPD TOKEN</span>
                <div className="text-4xl font-extrabold text-cyan-400">{queue?.servingToken ? `Token #${queue.servingToken}` : 'No active consult'}</div>
                <p className="text-xs text-slate-400 mt-1">Department: <strong className="text-white">{queue?.department || 'General Medicine'}</strong></p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleQueueAction('NEXT')} className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition active:scale-95">
                  Call Next Patient
                </button>
                <button onClick={() => handleQueueAction('COMPLETE')} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95">
                  Complete Consultation
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Waiting Queue List */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Waiting Queue Entries</span>
                  <span className="text-xs text-slate-400 font-normal">Total: {queue?.entries?.length || 0}</span>
                </h3>

                <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
                  {queue?.entries?.length === 0 || !queue ? (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800/80">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400">OPD Queue is currently empty.</p>
                    </div>
                  ) : (
                    queue?.entries?.map(e => (
                      <div key={e._id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">Token #{e.tokenNumber} - <span className="text-cyan-400">{e.patientName}</span></div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Est. Wait: {e.estimatedWaitMinutes || 0} mins • Checked in: {new Date(e.checkInTime).toLocaleTimeString()}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${e.status === 'IN_CONSULTATION' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'}`}>
                          {e.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Prescription Writer */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">Issue Clinical Prescription to Care Journey</h3>
                <form onSubmit={handlePrescriptionSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Select Patient Appointment *</label>
                    <select
                      value={prescriptionForm.appointmentId}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, appointmentId: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Patient Appointment --</option>
                      {appointments.map(a => (
                        <option key={a._id} value={a._id}>
                          {a.patientId?.name || 'Patient'} ({a.timeSlot} - {a.type} - {a.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Diagnosis *</label>
                    <input
                      type="text"
                      value={prescriptionForm.diagnosis}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Hypertension & Recurrent Angina"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Medicines & Dosage</label>
                    {prescriptionForm.medicines.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Medicine"
                          value={m.name}
                          onChange={e => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].name = e.target.value;
                            setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={m.dosage}
                          onChange={e => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].dosage = e.target.value;
                            setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={m.frequency}
                          onChange={e => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].frequency = e.target.value;
                            setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={m.duration}
                          onChange={e => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].duration = e.target.value;
                            setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                          }}
                          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Doctor Clinical Advice</label>
                    <textarea
                      rows={2}
                      value={prescriptionForm.advice}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, advice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Lifestyle guidance, follow-up date..."
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition">
                    Issue Prescription to Care Journey
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: TELECONSULTATION ROOM ----------------- */}
        {activeTab === 'teleconsultation' && (
          <div className="space-y-6 text-xs">
            {/* Active Teleconsultation Room Console */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white">Active Doctor Specialist Room</h3>
                  {activeTeleSession && (
                    <span className="text-slate-400 text-[11px]">
                      Patient: <strong className="text-white">{activeTeleSession.patientName}</strong> • Specialty: <strong className="text-cyan-400">{activeTeleSession.specialty}</strong> • Problem: <strong className="text-amber-400">{activeTeleSession.symptoms}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeTeleSession && activeTeleSession.status === 'ACTIVE' && (
                    <button
                      onClick={handleDoctorTerminateCall}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30"
                    >
                      <PhoneOff className="w-4 h-4" /> End Call
                    </button>
                  )}
                  {activeTeleSession && (
                    <button
                      onClick={handleDoctorClearAndStopConsultation}
                      className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-rose-700/30 transition active:scale-95"
                      title="Completely clear patient consultation from doctor console and schedule 3-day auto-purge from MongoDB"
                    >
                      <Trash2 className="w-4 h-4" /> Clear & Stop Consultation
                    </button>
                  )}
                </div>
              </div>

              {activeTeleSession ? (
                <div className="space-y-4">
                  {/* LiveKit Teleconsultation Call Control Hub */}
                  <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-400/30 text-white flex items-center justify-center mx-auto shadow-xl shadow-cyan-950 animate-pulse">
                      <Video className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white">LiveKit Teleconsultation Hub ({activeTeleSession.status})</h4>
                    <p className="text-slate-400 text-xs max-w-md mx-auto">
                      Patient: <strong className="text-slate-200">{activeTeleSession.patientName}</strong> • Specialty: <strong className="text-cyan-400">{activeTeleSession.specialty}</strong> • Meeting ID: <strong className="font-mono text-indigo-300">{activeTeleSession.meetingIdentifier}</strong>
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-3">
                      <button
                        onClick={() => handleStartCall(activeTeleSession)}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
                      >
                        <Video className="w-4 h-4" /> Launch LiveKit Video Call
                      </button>
                      <button
                        onClick={() => handleResendEmail(activeTeleSession._id, activeTeleSession.patientEmail)}
                        className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
                      >
                        <Mail className="w-4 h-4 text-cyan-400" /> Send Join Link Email
                      </button>
                      <button
                        onClick={handleDoctorTerminateCall}
                        className="px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-500/30 transition"
                      >
                        <PhoneOff className="w-4 h-4" /> End Live Call Mode
                      </button>
                      <button
                        onClick={handleDoctorClearAndStopConsultation}
                        className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" /> Clear & Stop Consultation
                      </button>
                    </div>
                  </div>


                  {/* Live In-Session Text Chat (During Active Call) */}
                  {activeTeleSession.status === 'ACTIVE' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-cyan-400" /> In-Session Realtime Text Chat</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Socket Channel</span>
                      </div>
                      <div className="h-36 overflow-y-auto space-y-2 p-3 bg-slate-900 rounded-xl text-[11px]">
                        {inSessionChat.length === 0 ? (
                          <div className="text-slate-500 text-center py-6">No chat messages during this call session yet. Type below to message patient.</div>
                        ) : (
                          inSessionChat.map((c, idx) => (
                            <div key={idx} className={`p-2.5 rounded-xl border max-w-[85%] ${c.sender.includes('Dr.') ? 'bg-cyan-950/60 border-cyan-800 text-cyan-200 ml-auto' : 'bg-slate-950 border-slate-800 text-slate-200 mr-auto'}`}>
                              <div className="font-bold text-[10px] text-slate-400 mb-0.5">{c.sender}</div>
                              <div className="text-slate-100">{c.text}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <form onSubmit={handleDoctorSendInSessionChat} className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type live message for patient during call..."
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 10 Post-Session Patient Follow-Up Messages Channel */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="font-bold text-cyan-400 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Post-Session 10-Message Follow-Up Channel (Patient: {activeTeleSession.patientName})
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px]">
                        Quota Remaining: {postMessagesLeft} / 10
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto p-2.5 bg-slate-900 rounded-xl">
                      {postMessages.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-[11px]">No post-session messages received yet.</p>
                      ) : (
                        postMessages.map((m, idx) => (
                          <div key={idx} className={`p-2.5 rounded-lg border text-[11px] ${m.sender === 'DOCTOR' ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200 ml-6' : 'bg-slate-950 border-slate-800 text-slate-200 mr-6'}`}>
                            <div className="flex justify-between font-bold text-[10px] text-slate-400 mb-1">
                              <span>{m.sender === 'DOCTOR' ? formatDoctorName(user?.doctor?.fullName || user?.name || activeTeleSession.doctorName) : activeTeleSession.patientName}</span>
                              <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p>{m.text}</p>
                            {m.voiceClipUrl && (
                              <audio controls src={m.voiceClipUrl} className="mt-2 w-full h-8 rounded" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Doctor Reply Input & Voice Note Recorder */}
                    <form onSubmit={handleDoctorSendPostReply} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={doctorReplyText}
                        onChange={e => setDoctorReplyText(e.target.value)}
                        placeholder="Type clinical reply to patient post-session..."
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                      />

                      {/* Doctor Voice Note Recorder Button */}
                      <button
                        type="button"
                        onClick={handleDoctorToggleVoiceRecorder}
                        title={isRecordingVoiceNote ? "Stop & Send Doctor Voice Clip" : "Record Doctor Voice Clip Note"}
                        className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1 ${isRecordingVoiceNote ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'}`}
                      >
                        <Mic className="w-4 h-4" />
                        <span className="text-[10px]">{isRecordingVoiceNote ? 'Stop & Send' : 'Voice'}</span>
                      </button>

                      <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Reply
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Select a confirmed teleconsultation session below to launch room console.</p>
              )}
            </div>

            {/* List of Doctor Confirmed Teleconsultations */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">My Scheduled & Confirmed Teleconsultations</h3>
              <div className="space-y-3">
                {teleSessions.filter(s => s.status !== 'PENDING').length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No active teleconsultation sessions assigned yet.</p>
                ) : (
                  teleSessions.filter(s => s.status !== 'PENDING').map(s => (
                    <div key={s._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-white text-sm">{s.patientName}</div>
                        <div className="text-cyan-400 font-semibold text-xs mt-0.5">{s.specialty} • Symptoms: {s.symptoms}</div>
                        <div className="text-slate-500 text-[10px] mt-1">Hospital: {s.facilityName || 'District Health Hub'} • Time: {s.scheduledTime || 'Today'} • Status: <strong className="text-emerald-400">{s.status}</strong></div>
                      </div>

                      <div className="flex gap-2 shrink-0 items-center">
                        <button
                          onClick={() => handleResendEmail(s._id, s.patientEmail)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1"
                          title="Re-send Email Notification to Patient"
                        >
                          <Mail className="w-3.5 h-3.5" /> Resend Email
                        </button>
                        <button
                          onClick={() => {
                            setActiveTeleSession(s);
                            setPostMessages(s.postSessionMessages || []);
                            setPostMessagesLeft(s.postSessionMessagesLeft ?? 10);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                        >
                          View Messages
                        </button>
                        <button
                          onClick={() => handleStartCall(s)}
                          className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                        >
                          <Video className="w-3.5 h-3.5" /> Launch Room
                        </button>
                        <button
                          onClick={(e) => handleDeleteDoctorSession(s._id, e)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/20 transition"
                          title="Delete & Clear Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unassigned Teleconsultation Requests (Pending Assignment) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Unassigned Hospital & Patient Teleconsultation Requests
              </h3>
              <div className="space-y-3">
                {teleSessions.filter(s => s.status === 'PENDING').length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No unassigned teleconsultation requests pending.</p>
                ) : (
                  teleSessions.filter(s => s.status === 'PENDING').map(s => (
                    <div key={s._id} className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-white text-sm">{s.patientName} <span className="text-amber-400 text-xs">(Awaiting Doctor Assignment)</span></div>
                        <div className="text-slate-300 text-xs mt-0.5">Specialty: <strong>{s.specialty}</strong> • Symptoms: {s.symptoms}</div>
                        <div className="text-slate-500 text-[10px] mt-1">Facility: {s.facilityName} • Email: {s.patientEmail || 'N/A'}</div>
                      </div>

                      <button
                        onClick={() => handleClaimSession(s._id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0"
                      >
                        <UserCheck className="w-4 h-4" /> Accept & Claim Request
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: MY APPOINTMENTS ----------------- */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 text-xs">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-white text-xs">Filter Status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['ALL', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setAppointmentFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${appointmentFilter === st ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Grid */}
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No appointments found matching current filter.</p>
                </div>
              ) : (
                filteredAppointments.map(a => (
                  <div key={a._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-base font-bold text-white">{a.patientId?.name || 'Patient'}</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${a.triageLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : a.triageLevel === 'URGENT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                          Triage: {a.triageLevel || 'NORMAL'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold text-[10px]">{a.type}</span>
                      </div>
                      <div className="text-slate-300 text-xs">
                        Department: <strong>{a.department}</strong> • Slot: <strong className="text-cyan-400">{a.timeSlot}</strong> • Date: {new Date(a.appointmentDate).toLocaleDateString()}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Symptoms: <i>{a.symptoms || 'None recorded'}</i> • Facility: {a.facilityId?.name || 'District Hospital'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded-xl font-bold text-xs ${a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'}`}>
                        {a.status}
                      </span>
                      {a.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setPrescriptionForm(prev => ({ ...prev, appointmentId: a._id }));
                            setActiveTab('queue');
                          }}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                        >
                          Write Prescription <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: MY REFERRALS ----------------- */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {['ALL', 'INCOMING', 'OUTGOING'].map(type => (
                  <button
                    key={type}
                    onClick={() => setReferralFilter(type)}
                    className={`px-4 py-2 rounded-xl font-bold transition ${referralFilter === type ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
                  >
                    {type} Referrals
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowReferralModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" /> Create Patient Referral
              </button>
            </div>

            {/* Referrals List */}
            <div className="space-y-3">
              {referrals.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No clinical referrals logged.</p>
                </div>
              ) : (
                referrals.map(r => (
                  <div key={r._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-base font-bold text-white">{r.patientId?.name || 'Patient'}</span>
                        <span className="ml-3 text-cyan-400 font-semibold text-xs">Referred to: {r.receivingFacilityId?.name || 'Specialist Hospital'}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] ${r.urgency === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {r.urgency} URGENCY
                      </span>
                    </div>

                    <div className="text-slate-300 text-xs">
                      Department: <strong>{r.department}</strong> • Reason: <i>{r.reason}</i>
                    </div>

                    {r.clinicalNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                        <strong>Clinical Notes:</strong> {r.clinicalNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Create Referral Modal */}
            {showReferralModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
                  <h3 className="text-base font-bold text-white">Create Multi-Tier Patient Referral</h3>
                  <form onSubmit={handleCreateReferral} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Select Patient *</label>
                      <select
                        value={referralForm.patientId}
                        onChange={e => setReferralForm({ ...referralForm, patientId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      >
                        <option value="">-- Choose Patient --</option>
                        {appointments.map(a => (
                          <option key={a._id} value={a.patientId?._id}>{a.patientId?.name || 'Patient'}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Receiving Healthcare Facility *</label>
                      <select
                        value={referralForm.receivingFacilityId}
                        onChange={e => setReferralForm({ ...referralForm, receivingFacilityId: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      >
                        {facilities.map(f => (
                          <option key={f._id} value={f._id}>{f.name} ({f.facilityType})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Department *</label>
                        <input type="text" value={referralForm.department} onChange={e => setReferralForm({ ...referralForm, department: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Urgency *</label>
                        <select value={referralForm.urgency} onChange={e => setReferralForm({ ...referralForm, urgency: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white">
                          <option value="ROUTINE">ROUTINE</option>
                          <option value="URGENT">URGENT</option>
                          <option value="EMERGENCY">EMERGENCY</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Referral Reason *</label>
                      <input type="text" value={referralForm.reason} onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" placeholder="Specialist intervention..." />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Clinical Notes & Summary</label>
                      <textarea rows={2} value={referralForm.clinicalNotes} onChange={e => setReferralForm({ ...referralForm, clinicalNotes: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowReferralModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold">Cancel</button>
                      <button type="submit" className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold">Dispatch Referral</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 5: ASSOCIATED FACILITIES ----------------- */}
        {activeTab === 'facilities' && (
          <div className="space-y-6 text-xs">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white mb-2">My Associated Healthcare Facilities (Many-to-Many Network)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {associations.length === 0 ? (
                  <p className="text-slate-500 col-span-2 py-4">No associated healthcare facilities linked yet.</p>
                ) : (
                  associations.map(a => (
                    <div key={a._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-white text-sm">{a.facilityId?.name || 'Healthcare Facility'}</div>
                      <div className="text-slate-400 text-xs mt-1">Department: <strong className="text-cyan-400">{a.department}</strong> • Designation: {a.designation}</div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">{a.status}</span>
                        <span className="text-[10px] text-slate-500">Employment: {a.employmentType}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Request Link to Healthcare Facility */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Link / Request Association with a Public Healthcare Facility
              </h3>
              <form onSubmit={handleRequestAssociation} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Healthcare Facility *</label>
                  <select
                    value={associationForm.facilityId}
                    onChange={e => setAssociationForm({ ...associationForm, facilityId: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    {facilities.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.facilityType} - {f.district})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Department *</label>
                  <input
                    type="text"
                    value={associationForm.department}
                    onChange={e => setAssociationForm({ ...associationForm, department: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Designation *</label>
                  <input
                    type="text"
                    value={associationForm.designation}
                    onChange={e => setAssociationForm({ ...associationForm, designation: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Employment Type</label>
                  <select
                    value={associationForm.employmentType}
                    onChange={e => setAssociationForm({ ...associationForm, employmentType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="VISITING">VISITING</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button type="submit" className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Submit Facility Association Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LiveKit Call Modal */}
        {showLiveKitModal && liveKitRoomName && (
          <LiveKitCallModal
            roomName={liveKitRoomName}
            participantName={formatDoctorName(user?.doctor?.fullName || user?.name || 'Doctor')}
            callType={liveKitCallType}
            sessionId={activeTeleSession?._id}
            onClose={() => setShowLiveKitModal(false)}
            onCallEnded={() => setInCall(false)}
          />
        )}
      </main>
    </div>
  );
}

