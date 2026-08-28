import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, PhoneOff, Send, CheckCircle2, Clock, AlertCircle, Building2, User, Mail, Phone, MessageSquare, Volume2, ShieldCheck, RefreshCw, Paperclip, Trash2 } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

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
  const [inSessionChat, setInSessionChat] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Post-Session Follow-Up 10-Message Quota States
  const [postMessageText, setPostMessageText] = useState('');
  const [postMessages, setPostMessages] = useState([]);
  const [postMessagesLeft, setPostMessagesLeft] = useState(10);

  // Socket & WebRTC Refs
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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

  // Connect Socket.io when session is active or confirmed
  useEffect(() => {
    if (activeSession && (activeSession.status === 'CONFIRMED' || activeSession.status === 'ACTIVE' || activeSession.status === 'TERMINATED')) {
      const socket = io(CARE_BACKEND_URL);
      socketRef.current = socket;

      socket.emit('join_teleconsultation', {
        meetingIdentifier: activeSession.meetingIdentifier,
        userRole: 'PATIENT',
        name: activeSession.patientName,
      });

      socket.on('call_terminated_by_doctor', (data) => {
        setInCall(false);
        setActiveSession(prev => ({ ...prev, status: 'TERMINATED', postSessionMessagesLeft: 10 }));
        setPostMessagesLeft(10);
        alert(data.message);
      });

      socket.on('new_in_session_chat', (chatItem) => {
        setInSessionChat(prev => [...prev, chatItem]);
      });

      socket.on('new_post_session_message', (data) => {
        setPostMessages(prev => [...prev, data.message]);
        setPostMessagesLeft(data.postSessionMessagesLeft);
      });

      socket.on('media_mode_changed', ({ mode }) => {
        setMediaMode(mode);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [activeSession?.meetingIdentifier, activeSession?.status]);

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

  // Join Live Consultation Session
  const handleJoinSession = async () => {
    try {
      const res = await axios.put(`${CARE_BACKEND_URL}/api/teleconsultations/${activeSession._id}/start`);
      setActiveSession(res.data);
      setInCall(true);
    } catch (err) {
      alert('Failed to start session');
    }
  };

  // Send In-Session Chat Message
  const handleSendInSessionChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_in_session_chat', {
      roomId: `telecon:${activeSession.meetingIdentifier}`,
      meetingIdentifier: activeSession.meetingIdentifier,
      sender: activeSession.patientName,
      text: chatInput,
    });
    setChatInput('');
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
                  <div className="text-[10px] text-slate-500 mt-1">ID: {s.meetingIdentifier}</div>
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
                    {/* Media Screen Placeholder / Stream */}
                    <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                      {mediaMode === 'VIDEO' ? (
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                            <Video className="w-8 h-8" />
                          </div>
                          <div className="text-sm font-bold text-white">Live WebRTC Video Stream Active</div>
                          <div className="text-slate-400 text-[10px]">Connected with Dr. {activeSession.doctorName || 'Specialist'}</div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                            <Mic className="w-8 h-8" />
                          </div>
                          <div className="text-sm font-bold text-emerald-400">Voice Only Mode Active (Bandwidth Saver)</div>
                          <div className="text-slate-400 text-[10px]">Connected via low-bandwidth audio socket channel</div>
                        </div>
                      )}

                      {/* Controls Bar */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                        <button
                          onClick={() => {
                            const newMode = mediaMode === 'VIDEO' ? 'VOICE_ONLY' : 'VIDEO';
                            setMediaMode(newMode);
                            if (socketRef.current) {
                              socketRef.current.emit('switch_media_mode', { roomId: `telecon:${activeSession.meetingIdentifier}`, mode: newMode });
                            }
                          }}
                          className={`px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 ${mediaMode === 'VIDEO' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}
                        >
                          {mediaMode === 'VIDEO' ? <Video className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                          <span>{mediaMode === 'VIDEO' ? 'Switch to Voice Only' : 'Switch to Video'}</span>
                        </button>
                      </div>
                    </div>

                    {/* In-Session Live Text Chat */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-indigo-400" /> In-Session Live Chat</span>
                        <span className="text-[10px] text-slate-500">Active fallback for low connectivity</span>
                      </div>
                      <div className="h-32 overflow-y-auto space-y-2 p-2 bg-slate-900 rounded-xl text-[11px]">
                        {inSessionChat.map((c, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="font-bold text-indigo-400">{c.sender}: </span>
                            <span className="text-slate-200">{c.text}</span>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleSendInSessionChat} className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Type in-session message..."
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                        />
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                          Send
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
                    <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-slate-950 rounded-xl">
                      {postMessages.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                          <div className="flex justify-between font-bold text-slate-400">
                            <span>{m.sender}</span>
                            <span className="text-[9px]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-200 mt-1">{m.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Message Form */}
                    {postMessagesLeft > 0 ? (
                      <form onSubmit={handleSendPostMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={postMessageText}
                          onChange={e => setPostMessageText(e.target.value)}
                          placeholder="Type follow-up text or question..."
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                        />
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
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
