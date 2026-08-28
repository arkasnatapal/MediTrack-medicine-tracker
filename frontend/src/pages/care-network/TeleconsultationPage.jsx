import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Send, CheckCircle2, Clock, AlertCircle, Building2, User, Mail, Phone, MessageSquare, Volume2, ShieldCheck, RefreshCw, Paperclip, Trash2, Radio, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import axios from 'axios';
import LiveKitCallModal from '../../components/calling/LiveKitCallModal';

const CARE_BACKEND_URL = 'http://localhost:5001';

export default function TeleconsultationPage() {

  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [specialty, setSpecialty] = useState('Cardiology');
  const [symptoms, setSymptoms] = useState('');
  const [patientName, setPatientName] = useState('Ankit Roy');
  const [patientEmail, setPatientEmail] = useState('ankit.patient@meditrack.care');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');

  // Session & Tracking State
  const [activeSession, setActiveSession] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Call Room States
  const [inCall, setInCall] = useState(false);
  const [mediaMode, setMediaMode] = useState('VIDEO'); // 'VIDEO' or 'VOICE_ONLY'
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [modeSwitchToast, setModeSwitchToast] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inSessionChat, setInSessionChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // Post-Session Follow-Up 10-Message Quota States
  const [postMessageText, setPostMessageText] = useState('');
  const [postMessages, setPostMessages] = useState([]);
  const [postMessagesLeft, setPostMessagesLeft] = useState(10);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);

  // LiveKit Call Modal States
  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [liveKitRoomName, setLiveKitRoomName] = useState('');
  const [liveKitCallType, setLiveKitCallType] = useState('VIDEO');

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoContainerRef = useRef(null);


  // Fetch Facilities & Existing Sessions
  const loadInitialData = async () => {
    try {
      const [facRes, sessRes] = await Promise.all([
        axios.get(`${CARE_BACKEND_URL}/api/facilities`),
        axios.get(`${CARE_BACKEND_URL}/api/teleconsultations`),
      ]);
      setFacilities(facRes.data || []);
      if (facRes.data.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(facRes.data[0]._id);
      }
      setMySessions(sessRes.data || []);
      if (sessRes.data && sessRes.data.length > 0 && !activeSession) {
        setActiveSession(sessRes.data[0]);
        setPostMessages(sessRes.data[0].postSessionMessages || []);
        setPostMessagesLeft(sessRes.data[0].postSessionMessagesLeft ?? 10);
        setInSessionChat(sessRes.data[0].inSessionChat || []);
      }
    } catch (err) {
      console.error('Failed to load initial teleconsultation data:', err);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this teleconsultation request permanently from the database?')) {
      return;
    }
    try {
      await axios.delete(`${CARE_BACKEND_URL}/api/teleconsultations/${sessionId}`);
      setMySessions(prev => prev.filter(s => s._id !== sessionId && s.meetingIdentifier !== sessionId));
      if (activeSession && (activeSession._id === sessionId || activeSession.meetingIdentifier === sessionId)) {
        setActiveSession(null);
      }
      alert('Teleconsultation session deleted permanently from database.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete session');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Timer for call duration
  useEffect(() => {
    if (inCall) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inCall]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stop Call State
  const stopCallState = () => {
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

  // Handle Patient Consultation Request
  const handleRequestConsultation = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const facObj = facilities.find(f => f._id === selectedFacilityId);
      const res = await axios.post(`${CARE_BACKEND_URL}/api/teleconsultations/request`, {
        patientName,
        patientPhone,
        patientEmail,
        facilityId: selectedFacilityId,
        facilityName: facObj?.name || 'District Healthcare Hub',
        specialty,
        symptoms,
      });
      setActiveSession(res.data);
      alert('Teleconsultation Request Sent to Hospital Portal! Status: PENDING (Awaiting Hospital & Doctor Allocation)');
      loadInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Join Live Consultation Session via LiveKit
  const handleJoinSession = async () => {
    if (!activeSession) return;
    try {
      setInCall(true);

      const res = await axios.put(`${CARE_BACKEND_URL}/api/teleconsultations/${activeSession._id}/start`);
      setActiveSession(res.data);

      setLiveKitRoomName(`telecon_${activeSession.meetingIdentifier}`);
      setLiveKitCallType(mediaMode || 'VIDEO');
      setShowLiveKitModal(true);
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to join live session: ' + (err.response?.data?.message || err.message));
    }
  };

  // End Call locally
  const handleLeaveCall = () => {
    stopCallState();
  };


  // Send In-Session Chat Message
  const handleSendInSessionChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !activeSession) return;
    const textToSend = chatInput;
    setChatInput('');

    socketRef.current.emit('send_in_session_chat', {
      roomId: `telecon:${activeSession.meetingIdentifier}`,
      meetingIdentifier: activeSession.meetingIdentifier,
      sender: activeSession.patientName,
      text: textToSend,
    });

    try {
      await axios.post(`${CARE_BACKEND_URL}/api/teleconsultations/${activeSession._id}/in-session-chat`, {
        sender: activeSession.patientName,
        text: textToSend,
      });
    } catch (err) {
      console.error('Failed to save in-session chat to backend:', err);
    }
  };

  // Send Post-Session Follow-Up Message (Max 10)
  const handleSendPostMessage = async (e) => {
    e.preventDefault();
    if (!postMessageText.trim()) return;
    if (postMessagesLeft <= 0) {
      return alert('Post-session quota (10/10 messages) reached. Please request another session.');
    }
    try {
      const res = await axios.post(`${CARE_BACKEND_URL}/api/teleconsultations/${activeSession._id}/post-message`, {
        sender: 'PATIENT',
        text: postMessageText,
      });
      setPostMessages(res.data.session.postSessionMessages || []);
      setPostMessagesLeft(res.data.session.postSessionMessagesLeft);
      setPostMessageText('');
      alert('Follow-up message delivered directly to doctor portal!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send follow-up message');
    }
  };

  // Voice Note Recorder for Post-Session Follow-Up
  const handleToggleVoiceRecorder = async () => {
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
            if (postMessagesLeft <= 0) {
              return alert('Post-session message quota (10/10) reached.');
            }
            try {
              const res = await axios.post(`${CARE_BACKEND_URL}/api/teleconsultations/${activeSession._id}/post-message`, {
                sender: 'PATIENT',
                text: '🎙️ [Voice Note Clip]',
                voiceClipUrl: base64Audio,
              });
              setPostMessages(res.data.session.postSessionMessages || []);
              setPostMessagesLeft(res.data.session.postSessionMessagesLeft);
              alert('Voice clip message delivered to doctor portal!');
            } catch (err) {
              alert('Failed to send voice clip');
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black uppercase">
          <Video className="w-4 h-4" />
          <span>Remote Specialist Teleconsultation Ecosystem</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          SPECIALIST CONSULTATION HUB
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Request consultations with district hospital medical officers, receive confirmed email meeting links, and interact via WebRTC Video, Voice-Only mode, or live chat with 10 post-session follow-up messages.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Request Form & Facility Selector */}
        <div className="md:col-span-5 space-y-6">
          <form onSubmit={handleRequestConsultation} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              1. Request Specialist Consultation
            </h2>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Target Hospital / PHC *</label>
              <select
                value={selectedFacilityId}
                onChange={e => setSelectedFacilityId(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                {facilities.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.facilityType} • {f.district || 'District'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Medical Specialty *</label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                <option value="Cardiology">Cardiology (Heart Specialist)</option>
                <option value="General Medicine">General Medicine OPD</option>
                <option value="Pediatrics">Pediatrics (Child Health)</option>
                <option value="Orthopedics">Orthopedics & Bone Health</option>
                <option value="Neurology">Neurology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pulmonology">Pulmonology (Respiratory)</option>
                <option value="Gynecology">Gynecology & Maternity</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Consultation Reason / Symptoms *</label>
              <textarea
                rows="3"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                required
                placeholder="Describe your current symptoms, medical history, or follow-up reason..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Patient Name</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} required className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Notification Email</label>
                <input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} required className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Request to Hospital Portal</span>
            </button>
          </form>

          {/* Session History List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Your Recent Teleconsultation Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mySessions.map(s => (
                <div
                  key={s._id}
                  onClick={() => {
                    setActiveSession(s);
                    setPostMessages(s.postSessionMessages || []);
                    setPostMessagesLeft(s.postSessionMessagesLeft ?? 10);
                    setInSessionChat(s.inSessionChat || []);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${activeSession?._id === s._id ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold truncate max-w-[200px]">{s.specialty} • {s.facilityName}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${s.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'ACTIVE' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : s.status === 'TERMINATED' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        {s.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s._id || s.meetingIdentifier, e)}
                        title="Delete session permanently"
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between items-center">
                    <span>ID: {s.meetingIdentifier}</span>
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {s.scheduledTime || 'Pending Time'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Teleconsultation Room & Status Controller */}
        <div className="md:col-span-7 space-y-6">
          {!activeSession ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 text-slate-400">
              <Video className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No active teleconsultation selected. Submit a request or select a session on the left to track progress.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* STATUS CARD */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Session Identifier: {activeSession.meetingIdentifier}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{activeSession.specialty} Consultation</h3>
                    <p className="text-slate-400">{activeSession.facilityName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-black text-xs ${activeSession.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse' : activeSession.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : activeSession.status === 'ACTIVE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                    STATUS: {activeSession.status}
                  </span>
                </div>

                {/* Prominently Highlighted Scheduled Date & Time Banner */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Scheduled Date & Time:</span>
                    <span className="text-cyan-300 font-extrabold text-xs sm:text-sm bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-500/30 shadow-md">
                      {activeSession.scheduledTime || 'Awaiting Hospital Scheduling'}
                    </span>
                  </div>
                  {activeSession.doctorName && (
                    <div className="text-slate-300 font-semibold text-[11px]">
                      Doctor: <strong className="text-white">{activeSession.doctorName.startsWith('Dr.') ? activeSession.doctorName : `Dr. ${activeSession.doctorName}`}</strong>
                    </div>
                  )}
                </div>

                {/* State 1: PENDING */}
                {activeSession.status === 'PENDING' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Awaiting Hospital & Doctor Allocation...</span>
                    </div>
                    <p className="text-slate-300">
                      Your request has been delivered to <strong>{activeSession.facilityName}</strong>. A hospital administrator will assign an available medical officer and schedule your time.
                    </p>
                  </div>
                )}

                {/* State 2: CONFIRMED */}
                {activeSession.status === 'CONFIRMED' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Session Confirmed by Hospital!</span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <div><strong>Assigned Doctor:</strong> Dr. {activeSession.doctorName || 'Specialist Officer'}</div>
                      <div><strong>Scheduled Time:</strong> {activeSession.scheduledTime}</div>
                      <div><strong>Confirmation Email Sent To:</strong> {activeSession.patientEmail}</div>
                      {activeSession.meetingLink && (
                        <div className="pt-1 text-[11px] text-sky-400 break-all font-mono">
                          Link: {activeSession.meetingLink}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleJoinSession}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>JOIN CONSULTATION SESSION NOW</span>
                    </button>
                  </div>
                )}

                {/* State 3: ACTIVE LIVE CALL ROOM */}
                {activeSession.status === 'ACTIVE' && (
                  <div className="space-y-4">
                    {/* LiveKit Teleconsultation Call Control Hub */}
                    <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 shadow-2xl">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 border border-emerald-400/30 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-950 animate-pulse">
                        <Video className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-white">LiveKit Consultation Active</h4>
                      <p className="text-slate-400 text-xs max-w-md mx-auto">
                        Doctor: <strong className="text-emerald-400">Dr. {activeSession.doctorName || 'Specialist Officer'}</strong> • Specialty: <strong className="text-indigo-300">{activeSession.specialty}</strong> • Session ID: <strong className="font-mono text-slate-200">{activeSession.meetingIdentifier}</strong>
                      </p>
                      <div className="flex flex-wrap justify-center gap-3 pt-3">
                        <button
                          onClick={handleJoinSession}
                          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                        >
                          <Video className="w-4 h-4" /> Open LiveKit Call Window
                        </button>
                        <button
                          onClick={handleLeaveCall}
                          className="px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center gap-2 border border-rose-500/30 transition"
                        >
                          <PhoneOff className="w-4 h-4 text-rose-400" /> Leave Call View
                        </button>
                      </div>
                    </div>


                    {/* In-Session Live Text Chat */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-indigo-400" /> In-Session Realtime Text Chat</span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Socket Channel</span>
                      </div>
                      <div className="h-36 overflow-y-auto space-y-2 p-3 bg-slate-900 rounded-xl text-[11px]">
                        {inSessionChat.length === 0 ? (
                          <div className="text-slate-500 text-center py-6">No chat messages during this call session yet. Send a message below.</div>
                        ) : (
                          inSessionChat.map((c, idx) => (
                            <div key={idx} className={`p-2.5 rounded-xl border max-w-[85%] ${c.sender === activeSession.patientName ? 'bg-indigo-950/60 border-indigo-800 text-indigo-200 ml-auto' : 'bg-slate-950 border-slate-800 text-slate-200 mr-auto'}`}>
                              <div className="font-bold text-[10px] text-slate-400 mb-0.5">{c.sender}</div>
                              <div className="text-slate-100">{c.text}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <form onSubmit={handleSendInSessionChat} className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type live message for doctor during call..."
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* State 4: TERMINATED -> 10 Post-Session Follow-Up Messages */}
                {activeSession.status === 'TERMINATED' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-amber-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Session Ended by Doctor</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px]">
                        {postMessagesLeft} / 10 Messages Remaining
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      The video/audio session has concluded. If you missed asking something, you have <strong>{postMessagesLeft} post-session follow-up messages</strong> left to send directly to the doctor's portal.
                    </p>

                    {/* Messages History */}
                    <div className="space-y-2 max-h-52 overflow-y-auto p-3 bg-slate-950 rounded-xl">
                      {postMessages.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No follow-up messages sent yet.</p>
                      ) : (
                        postMessages.map((m, idx) => (
                          <div key={idx} className={`p-2.5 rounded-lg border text-[11px] ${m.sender === 'PATIENT' ? 'bg-indigo-950/40 border-indigo-800 text-indigo-200 ml-6' : 'bg-slate-900 border-slate-800 text-slate-200 mr-6'}`}>
                            <div className="flex justify-between font-bold text-slate-400">
                              <span>{m.sender === 'PATIENT' ? activeSession.patientName : `Dr. ${activeSession.doctorName || 'Doctor'}`}</span>
                              <span className="text-[9px]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-200 mt-1">{m.text}</p>
                            {m.voiceClipUrl && (
                              <audio controls src={m.voiceClipUrl} className="mt-2 w-full h-8 rounded" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Form & Voice Clip Recorder */}
                    {postMessagesLeft > 0 ? (
                      <form onSubmit={handleSendPostMessage} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={postMessageText}
                          onChange={e => setPostMessageText(e.target.value)}
                          placeholder="Type follow-up text or question..."
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                        
                        {/* Voice Note Clip Recorder Button */}
                        <button
                          type="button"
                          onClick={handleToggleVoiceRecorder}
                          title={isRecordingVoiceNote ? "Stop & Send Voice Clip" : "Record Voice Clip Note"}
                          className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1 ${isRecordingVoiceNote ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'}`}
                        >
                          <Mic className="w-4 h-4" />
                          <span className="text-[10px]">{isRecordingVoiceNote ? 'Stop & Send' : 'Voice'}</span>
                        </button>

                        <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> Send ({postMessagesLeft} left)
                        </button>
                      </form>
                    ) : (
                      <div className="text-rose-400 font-bold text-[11px] text-center">
                        Quota Exhausted (10/10 messages sent). Please request another session for further consultation.
                      </div>
                    )}
                  </div>
                )}

                {/* State 5: CLOSED -> Officially Closed by Doctor & 3-Day Auto-Archive Notice */}
                {activeSession.status === 'CLOSED' && (
                  <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-rose-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Consultation Officially Closed & Cleared by Specialist</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/30 animate-pulse">
                        ⏳ Auto-Archives in 3 Days
                      </span>
                    </div>
                    
                    <p className="text-slate-300 text-xs">
                      The specialist doctor has officially closed and cleared this consultation session. This session and its full message history will remain accessible for <strong>3 days</strong> before being automatically archived on: <strong className="text-amber-400 font-mono">{activeSession.expiresAt ? new Date(activeSession.expiresAt).toLocaleString() : 'in 3 days'}</strong>.
                    </p>

                    {/* Message Log History (Read-Only) */}
                    <div className="space-y-2 max-h-52 overflow-y-auto p-3 bg-slate-950 rounded-xl border border-slate-800">
                      {postMessages.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 text-xs">No follow-up messages stored.</p>
                      ) : (
                        postMessages.map((m, idx) => (
                          <div key={idx} className={`p-2.5 rounded-lg border text-[11px] ${m.sender === 'PATIENT' ? 'bg-indigo-950/40 border-indigo-800 text-indigo-200 ml-6' : 'bg-slate-900 border-slate-800 text-slate-200 mr-6'}`}>
                            <div className="flex justify-between font-bold text-slate-400">
                              <span>{m.sender === 'PATIENT' ? activeSession.patientName : `Dr. ${activeSession.doctorName || 'Specialist'}`}</span>
                              <span className="text-[9px]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-200 mt-1">{m.text}</p>
                            {m.voiceClipUrl && (
                              <audio controls src={m.voiceClipUrl} className="mt-2 w-full h-8 rounded" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-500/20">
                      <div className="text-rose-400 font-bold text-[11px]">
                        🔒 Consultation officially closed by doctor.
                      </div>
                      <button
                        onClick={() => handleDeleteSession(activeSession._id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 transition"
                        title="Delete & Clear Consultation from View"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear & Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LiveKit Call Modal */}
        {showLiveKitModal && liveKitRoomName && (
          <LiveKitCallModal
            roomName={liveKitRoomName}
            participantName={activeSession?.patientName || patientName || 'Patient'}
            callType={liveKitCallType}
            sessionId={activeSession?._id}
            onClose={() => setShowLiveKitModal(false)}
            onCallEnded={() => setInCall(false)}
          />
        )}
      </div>
    </div>
  );
}

