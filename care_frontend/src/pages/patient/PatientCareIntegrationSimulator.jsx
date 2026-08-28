import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { HeartPulse, ArrowLeft, Clock, MessageSquare, Mic, Play, RefreshCw, Send, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export default function PatientCareIntegrationSimulator() {
  const socket = useSocket();

  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [patientData, setPatientData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);

  // Post-Session Teleconsultation Chat State
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [postMessages, setPostMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [postMessagesLeft, setPostMessagesLeft] = useState(10);
  const [audioRecording, setAudioRecording] = useState(false);

  // Load Patient Care Journey
  const loadPatientCareJourney = async () => {
    try {
      const res = await api.get(`/care-journey/search?query=${patientPhone}`);
      setPatientData(res.data.patient);
      setTimeline(res.data.timeline);
    } catch (err) {
      console.error('Failed to load patient timeline:', err);
    }
  };

  // Load Queue Status
  const loadQueueStatus = async () => {
    try {
      const res = await api.get('/integration/queue-status', {
        params: {
          facilityId: 'FAC-DYN-DIST-2652-8873', // Sample ID
          tokenNumber: 102,
        },
      });
      setQueueStatus(res.data);
    } catch (err) {
      console.error('Failed to load queue status:', err);
    }
  };

  useEffect(() => {
    loadPatientCareJourney();
    loadQueueStatus();
  }, []);

  // Listen for Teleconsultation Socket events (Call Termination & Post-Session Messages)
  useEffect(() => {
    if (!socket || !activeSessionId) return;

    socket.emit('join_teleconsultation', {
      sessionId: activeSessionId,
      userId: patientData?._id || 'patient-test-id',
      userRole: 'PATIENT',
    });

    socket.on('call_terminated_by_doctor', (data) => {
      alert(data.message);
      setSessionDetails(prev => ({ ...prev, status: 'TERMINATED', postSessionMessagesLeft: 10 }));
      setPostMessagesLeft(10);
    });

    socket.on('new_post_session_message', (data) => {
      setPostMessages(prev => [...prev, data.message]);
      setPostMessagesLeft(data.postSessionMessagesLeft);
    });

    return () => {
      socket.off('call_terminated_by_doctor');
      socket.off('new_post_session_message');
    };
  }, [socket, activeSessionId]);

  // Load Teleconsultation Session
  const loadTeleSession = async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/teleconsultations/${sessionId}`);
      setSessionDetails(res.data.session);
      setPostMessages(res.data.messages);
      setPostMessagesLeft(res.data.session.postSessionMessagesLeft);
    } catch (err) {
      console.error('Session error:', err);
    }
  };

  // Patient sends post-session follow-up message (Text or Audio clip)
  const handleSendPostMessage = async (isAudio = false) => {
    if (!activeSessionId) return alert('Enter a valid Teleconsultation Session ID first');
    if (postMessagesLeft <= 0) {
      return alert('Post-session message quota (10 messages) has been exhausted for this session. Please book another appointment to consult again.');
    }

    const payload = {
      senderId: patientData?._id || 'patient-id',
      senderName: patientData?.name || 'Rahul Mukherjee',
      content: isAudio ? 'Voice clip follow-up note' : messageInput,
      messageType: isAudio ? 'VOICE_CLIP' : 'TEXT',
      audioUrl: isAudio ? 'https://example.com/sample_voice_clip.mp3' : null,
    };

    try {
      const res = await api.post(`/teleconsultations/${activeSessionId}/post-session-message`, payload);
      setPostMessages(prev => [...prev, res.data.message]);
      setPostMessagesLeft(res.data.postSessionMessagesLeft);
      setMessageInput('');
    } catch (err) {
      alert(err.response?.data?.message || 'Send message failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-950 border border-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Patient MediTrack Integration Portal</h1>
            <p className="text-xs text-slate-400">Simulating Patient Connection to Provider Care Backend</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Active Patient:</span>
          <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
            {patientData?.name || 'Rahul Mukherjee'} ({patientPhone})
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-6">
        <div className="flex space-x-2 border-b border-slate-800 pb-3">
          {[
            { id: 'queue', label: 'Live Queue Token Monitor', icon: Clock },
            { id: 'telechat', label: 'Post-Session Teleconsult Chat (10 Max)', icon: MessageSquare },
            { id: 'journey', label: 'Visual Care Journey Timeline', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${activeSubTab === tab.id ? 'bg-teal-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {/* Live Queue Monitor */}
        {activeSubTab === 'queue' && (
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto text-center shadow-xl">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">My Appointment Token</span>
              <div className="text-5xl font-extrabold text-teal-400 mb-6">Token #102</div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 text-xs">
                <div>
                  <span className="text-slate-400 block">Currently Serving Token</span>
                  <span className="text-xl font-bold text-white">#101</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estimated Wait Time</span>
                  <span className="text-xl font-bold text-amber-400">~12 Minutes</span>
                </div>
              </div>

              <button onClick={loadQueueStatus} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 mx-auto border border-slate-700">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue Status
              </button>
            </div>
          </div>
        )}

        {/* Post-Session Teleconsult Chat */}
        {activeSubTab === 'telechat' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">Teleconsultation Session Lookup</h3>
              <p className="text-xs text-slate-400 mb-4">
                Enter your Teleconsultation Session ID to join post-session follow-up chat after the doctor terminates the call.
              </p>

              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={activeSessionId}
                  onChange={e => setActiveSessionId(e.target.value)}
                  placeholder="Paste Session Mongo ID"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button onClick={() => loadTeleSession(activeSessionId)} className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs">
                  Load Session
                </button>
              </div>

              {/* POST-SESSION MESSAGES QUOTA DISPLAY */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Doctor Session Status:</span>
                  <span className={`font-bold uppercase ${sessionDetails?.status === 'TERMINATED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {sessionDetails?.status || 'TERMINATED / COMPLETED'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Post-Session Messages Left:</span>
                  <span className="text-lg font-extrabold text-teal-400">{postMessagesLeft} / 10 Remaining</span>
                </div>
              </div>
            </div>

            {/* Chat Box */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-96">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                {postMessages.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">No post-session messages sent yet. Ask follow-up questions or send a small voice clip.</p>
                ) : (
                  postMessages.map(msg => (
                    <div key={msg._id} className={`flex flex-col ${msg.senderRole === 'PATIENT' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-sm ${msg.senderRole === 'PATIENT' ? 'bg-teal-500 text-slate-950 font-medium' : 'bg-slate-800 text-white'}`}>
                        <div className="font-bold text-[10px] opacity-75 mb-0.5">{msg.senderName} ({msg.senderRole})</div>
                        {msg.messageType === 'VOICE_CLIP' ? (
                          <div className="flex items-center gap-2 font-bold py-1">
                            <Play className="w-4 h-4" /> <span>Voice Clip Attachment</span>
                          </div>
                        ) : (
                          <div>{msg.content}</div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Controls */}
              <div className="pt-4 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder={postMessagesLeft > 0 ? "Type follow-up question..." : "Post-session quota reached (10/10)"}
                  disabled={postMessagesLeft <= 0}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button
                  onClick={() => handleSendPostMessage(false)}
                  disabled={postMessagesLeft <= 0 || !messageInput}
                  className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSendPostMessage(true)}
                  disabled={postMessagesLeft <= 0}
                  title="Send Small Voice Clip"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Care Journey Timeline */}
        {activeSubTab === 'journey' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-1">Unified Patient Care Journey Timeline</h3>
              <p className="text-xs text-slate-400 mb-6">Automated chronological care timeline logged across PHCs, Hospitals, Referrals, and Lab Reports.</p>

              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                {timeline.map((evt, idx) => (
                  <div key={evt._id || idx} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-teal-500 border-4 border-slate-900" />
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{evt.title}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span className="text-teal-400 font-semibold block mb-2">{evt.facilityName} • {evt.doctorName}</span>
                      <p className="text-slate-300">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
