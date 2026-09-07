import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client';
import { getLiveKitToken } from '../../services/livekitService';
import axios from 'axios';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2, Minimize2,
  MessageSquare, Send, X, RefreshCw, UserCheck, ShieldAlert, Volume2
} from 'lucide-react';

const CARE_BACKEND_URL = import.meta.env.VITE_CARE_BACKEND_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : '');

export default function LiveKitCallModal({
  roomName,
  participantName,
  callType = 'VIDEO',
  onClose,
  onCallEnded,
  sessionId = null,
}) {
  const [room, setRoom] = useState(null);
  const [connectionState, setConnectionState] = useState('CONNECTING'); // CONNECTING, CONNECTED, RECONNECTING, DISCONNECTED, ERROR
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Media states
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(callType === 'VIDEO');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Remote participant stream state
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // Call Timer
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Video/Audio Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Initialize LiveKit Room Connection
  useEffect(() => {
    let currentRoom = null;
    let isMounted = true;

    async function connectToLiveKit() {
      try {
        setConnectionState('CONNECTING');
        setErrorMessage(null);

        // 1. Fetch authenticated token from care_backend
        const { token, serverUrl } = await getLiveKitToken(
          roomName,
          participantName || 'MediTrack User'
        );

        if (!isMounted) return;

        // 2. Initialize LiveKit Room instance
        const roomInstance = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { width: 1280, height: 720 },
          },

        });
        currentRoom = roomInstance;
        setRoom(roomInstance);

        // 3. Register Event Listeners
        roomInstance.on(RoomEvent.Connected, () => {
          if (!isMounted) return;
          console.log('✅ Connected to LiveKit Room:', roomName);
          setConnectionState('CONNECTED');

          // Enable local tracks based on callType
          const wantVideo = callType === 'VIDEO';
          roomInstance.localParticipant.setMicrophoneEnabled(true).catch(e => console.warn('Mic error:', e));
          roomInstance.localParticipant.setCameraEnabled(wantVideo).catch(e => console.warn('Camera error:', e));
        });

        roomInstance.on(RoomEvent.Reconnecting, () => {
          if (!isMounted) return;
          console.warn('⚠️ LiveKit Reconnecting...');
          setConnectionState('RECONNECTING');
        });

        roomInstance.on(RoomEvent.Reconnected, () => {
          if (!isMounted) return;
          console.log('✅ LiveKit Reconnected');
          setConnectionState('CONNECTED');
        });

        roomInstance.on(RoomEvent.Disconnected, (reason) => {
          if (!isMounted) return;
          console.log('🔴 LiveKit Disconnected:', reason);
          setConnectionState('DISCONNECTED');
        });

        // Remote Track Subscribed
        roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (!isMounted) return;
          console.log('🎥 Track Subscribed from:', participant.identity, track.kind);

          if (track.kind === Track.Kind.Video) {
            setRemoteStreamActive(true);
            if (remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
            }
          } else if (track.kind === Track.Kind.Audio) {
            if (remoteAudioRef.current) {
              track.attach(remoteAudioRef.current);
            }
          }
        });

        // Remote Track Unsubscribed
        roomInstance.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          console.log('Track Unsubscribed:', track.kind);
          track.detach();
          if (track.kind === Track.Kind.Video) {
            setRemoteStreamActive(false);
          }
        });

        // Participant Joined / Left
        const updateParticipants = () => {
          if (!isMounted) return;
          const remoteList = Array.from(roomInstance.remoteParticipants.values());
          setRemoteParticipants(remoteList);
        };

        roomInstance.on(RoomEvent.ParticipantConnected, updateParticipants);
        roomInstance.on(RoomEvent.ParticipantDisconnected, updateParticipants);

        // Real-Time Data Packet Received (In-Session Text Chat)
        roomInstance.on(RoomEvent.DataReceived, (payload, participant) => {
          if (!isMounted) return;
          try {
            const strData = new TextDecoder().decode(payload);
            const data = JSON.parse(strData);
            setChatMessages(prev => [...prev, {
              sender: participant?.name || data.sender || 'Participant',
              text: data.text,
              timestamp: new Date(data.timestamp || Date.now()),
            }]);
          } catch (err) {
            console.error('Data packet parse error:', err);
          }
        });

        // Local Track Published
        roomInstance.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (publication.track && publication.track.kind === Track.Kind.Video) {
            if (localVideoRef.current) {
              publication.track.attach(localVideoRef.current);
            }
          }
        });

        // 5. Connect to LiveKit Server
        const targetUrl = serverUrl || import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
        await roomInstance.connect(targetUrl, token);

      } catch (err) {
        if (!isMounted) return;
        console.error('LiveKit Room Connection Failed:', err);
        setConnectionState('ERROR');
        setErrorMessage(err.message || 'Could not connect to LiveKit media server.');
      }
    }

    connectToLiveKit();

    return () => {
      isMounted = false;
      if (currentRoom) {
        currentRoom.disconnect();
      }
    };
  }, [roomName, callType]);

  // Call Duration Timer
  useEffect(() => {
    if (connectionState === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Microphone
  const toggleMic = async () => {
    if (!room || connectionState !== 'CONNECTED') return;
    try {
      const nextState = !micOn;
      await room.localParticipant.setMicrophoneEnabled(nextState);
      setMicOn(nextState);
    } catch (err) {
      console.error('Mic toggle error:', err);
    }
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!room || connectionState !== 'CONNECTED') return;
    try {
      const nextState = !cameraOn;
      await room.localParticipant.setCameraEnabled(nextState);
      setCameraOn(nextState);
    } catch (err) {
      console.error('Camera toggle error:', err);
    }
  };

  // End / Leave Call
  const handleEndCall = async () => {
    if (room) {
      await room.disconnect();
    }
    if (onCallEnded) onCallEnded();
    if (onClose) onClose();
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  // Send In-Session Text Message via LiveKit Data Packet & DB
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msgText = chatInput.trim();
    const sender = participantName || 'Me';
    const timestamp = new Date();

    const payload = { sender, text: msgText, timestamp: timestamp.toISOString() };

    // 1. Send via LiveKit Data Packet (Real-time to room participants)
    if (room && connectionState === 'CONNECTED') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(payload));
        await room.localParticipant.publishData(data, { topic: 'chat' });
      } catch (err) {
        console.error('Failed to send LiveKit chat packet:', err);
      }
    }

    // Update local state
    setChatMessages(prev => [...prev, { sender: 'You', text: msgText, timestamp }]);
    setChatInput('');

    // 2. Persist to MongoDB via REST API if sessionId provided
    if (sessionId) {
      try {
        await axios.post(`${CARE_BACKEND_URL}/api/teleconsultations/${sessionId}/in-session-chat`, {
          sender,
          text: msgText,
        });
      } catch (err) {
        console.error('Failed to save in-session chat to DB:', err);
      }
    }
  };

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 text-white"
    >
      <audio ref={remoteAudioRef} autoPlay />

      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${
              connectionState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
              connectionState === 'CONNECTING' ? 'bg-amber-400 animate-spin' :
              connectionState === 'RECONNECTING' ? 'bg-amber-500 animate-ping' : 'bg-red-500'
            }`} />
            <div>
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                {callType === 'VIDEO' ? 'LiveKit Teleconsultation Video' : 'LiveKit Teleconsultation Voice'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {roomName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {connectionState === 'CONNECTED' ? `Connected • Duration: ${formatTime(callDuration)}` :
                 connectionState === 'CONNECTING' ? 'Connecting to LiveKit server...' :
                 connectionState === 'RECONNECTING' ? 'Reconnecting call...' :
                 connectionState === 'ERROR' ? 'Connection Error' : 'Disconnected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2.5 rounded-xl border transition-all ${
                showChat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Live Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 relative flex overflow-hidden bg-slate-950">
          {/* Main Video View Area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {connectionState === 'CONNECTING' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20">
                <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                <h4 className="text-lg font-semibold text-slate-200">Connecting to LiveKit Room...</h4>
                <p className="text-sm text-slate-400 mt-1">Initializing low-latency WebRTC streams</p>
              </div>
            )}

            {connectionState === 'ERROR' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 p-6 text-center">
                <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
                <h4 className="text-xl font-bold text-slate-100">LiveKit Connection Failed</h4>
                <p className="text-sm text-rose-400 mt-2 max-w-md">{errorMessage || 'Unable to join the requested call room.'}</p>
                <button
                  onClick={handleEndCall}
                  className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition-all shadow-lg"
                >
                  Close Window
                </button>
              </div>
            )}

            {callType === 'VIDEO' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remoteStreamActive ? 'block' : 'hidden'}`}
              />
            ) : null}

            {(!remoteStreamActive || callType === 'VOICE') && connectionState === 'CONNECTED' && (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl mb-4 border-4 border-indigo-400/30 animate-pulse">
                  <UserCheck className="w-14 h-14 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-slate-200">
                  {remoteParticipants.length > 0
                    ? remoteParticipants[0].name || 'Doctor'
                    : 'Waiting for Doctor to join...'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  {callType === 'VOICE' ? 'LiveKit Voice Only Mode' : 'Doctor camera is currently off'}
                </p>
              </div>
            )}

            {callType === 'VIDEO' && (
              <div className="absolute bottom-6 right-6 w-48 h-36 bg-slate-900 border-2 border-indigo-500/40 rounded-xl overflow-hidden shadow-2xl z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
                />
                {!cameraOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <VideoOff className="w-8 h-8 mb-1 text-slate-500" />
                    <span className="text-[10px]">Your Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-slate-200">
                  You ({participantName || 'Patient'})
                </div>
              </div>
            )}
          </div>

          {/* Right Side Drawer: In-Session Text Chat */}
          {showChat && (
            <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shadow-xl z-20">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  In-Session Chat
                </h4>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">
                    No messages yet in this consultation session.
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5">{msg.sender}</span>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          msg.sender === 'You'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type real-time message..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Call Controls */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition-all border shadow-lg ${
              micOn
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-rose-600/20 border-rose-500 text-rose-400 hover:bg-rose-600/30'
            }`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {callType === 'VIDEO' && (
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all border shadow-lg ${
                cameraOn
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-rose-600/20 border-rose-500 text-rose-400 hover:bg-rose-600/30'
              }`}
              title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all border border-rose-500 shadow-xl flex items-center justify-center"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
