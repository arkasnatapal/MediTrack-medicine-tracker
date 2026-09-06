import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Stethoscope, Calendar, Clock, UserCheck, Video, VideoOff, Mic, MicOff, FileText, Building2,
  PhoneOff, RefreshCw, Send, CheckCircle, CheckCircle2, AlertCircle, Plus, ShieldCheck,
  LogOut, MessageSquare, UserPlus, Filter, Check, ArrowRight, ShieldAlert,
  Mail, Phone, Info, Award, Radio, Trash2, Maximize2, Minimize2, Volume2, History,
  X, ArrowUpRight, Layers, Bed, Activity, AlertTriangle, Search, Dna, Pill, Heart, Sparkles, Users, Printer
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
  const [showDoctorHistoryModal, setShowDoctorHistoryModal] = useState(false);
  const [doctorHistoryTab, setDoctorHistoryTab] = useState('APPOINTMENTS');

  // MediTrack Patient Personal Health Record States
  const [selectedPatientHealth, setSelectedPatientHealth] = useState(null);
  const [loadingPatientHealth, setLoadingPatientHealth] = useState(false);
  const [patientHealthTab, setPatientHealthTab] = useState('MEDS'); // 'MEDS', 'REPORTS', 'GENETICS', 'HEALTH', 'VITALS'
  const [showFullEhrModal, setShowFullEhrModal] = useState(false);
  const [selectedReportModal, setSelectedReportModal] = useState(null);

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
    isOfflinePrescription: false,
    diagnosis: '',
    medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5 days' }],
    advice: 'Drink plenty of warm fluids & rest adequately.',
  });

  const handleAddMedicineRow = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '1-0-1', duration: '5 days' }]
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, idx) => idx !== index)
    }));
  };


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

  // Enhanced Referral & Transfer System States
  const [transfers, setTransfers] = useState([]);
  const [colleagueDoctors, setColleagueDoctors] = useState([]);
  const [referralModalType, setReferralModalType] = useState('INTRA_HOSPITAL'); // 'INTRA_HOSPITAL' or 'INTER_HOSPITAL'
  const [targetState, setTargetState] = useState('Delhi');
  const [locationSearchQuery, setLocationSearchQuery] = useState('Delhi');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [targetStateFacilities, setTargetStateFacilities] = useState([]);
  const [targetFacilityDoctors, setTargetFacilityDoctors] = useState([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [familyConsent, setFamilyConsent] = useState({
    consentGiven: true,
    familyMemberName: '',
    familyRelation: 'Spouse',
    familyContact: '',
    consentNotes: 'Bedside written consent obtained',
  });
  const [isInterStateConfirmed, setIsInterStateConfirmed] = useState(false);
  const [interStateJustification, setInterStateJustification] = useState('Specialized tertiary care facility required.');

  // Provide Advice Modal State
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [selectedReferralForAdvice, setSelectedReferralForAdvice] = useState(null);
  const [adviceForm, setAdviceForm] = useState({
    adviceNotes: '',
    recommendedDiagnosis: '',
    recommendedTreatment: '',
  });

  const doctorId = user?.doctor?._id || user?.doctorId?._id || user?.doctorId;

  // Fetch facilities dynamically by location query (State/City/Locality string)
  const fetchFacilitiesForLocation = async (locQuery) => {
    const q = (locQuery || locationSearchQuery || targetState || 'Delhi').trim();
    setIsSearchingLocation(true);
    try {
      const res = await api.get('/facilities', { params: { location: q, state: q, search: q } });
      const facs = res.data?.facilities || res.data || [];
      setTargetStateFacilities(facs);

      // Find first VERIFIED & SELECTABLE facility
      const verifiedSelectable = facs.find(f => f.isMediTrackVerified && f.canSelect !== false);
      if (verifiedSelectable) {
        const firstId = verifiedSelectable._id || verifiedSelectable.facilityId;
        setReferralForm(prev => ({ ...prev, receivingFacilityId: firstId }));
        fetchDoctorsForFacility(firstId, q);
      } else {
        setReferralForm(prev => ({ ...prev, receivingFacilityId: '' }));
        setTargetFacilityDoctors([]);
        setTargetDoctorId('');
      }
    } catch (err) {
      console.warn('Error loading location facilities:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const fetchFacilitiesForState = fetchFacilitiesForLocation;

  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);
  const isFetching = isSearchingLocation || isFetchingDoctors;

  // Fetch doctors affiliated with selected target hospital
  const fetchDoctorsForFacility = async (facId, locName) => {
    setIsFetchingDoctors(true);
    try {
      const res = await api.get('/doctors', { params: { facilityId: facId, state: locName || locationSearchQuery || targetState } });
      const docList = res.data || [];
      setTargetFacilityDoctors(docList);
      if (docList.length > 0) {
        setTargetDoctorId(docList[0]._id);
      } else {
        setTargetDoctorId('');
      }
    } catch (err) {
      console.warn('Error loading facility doctors:', err);
    } finally {
      setIsFetchingDoctors(false);
    }
  };

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
        api.get('/transfers'),
        api.get('/doctors'),
      ]);

      const [appRes, refRes, assocRes, teleRes, qRes, facRes, transRes, docRes] = results;

      if (appRes.status === 'fulfilled') setAppointments(appRes.value.data || []);
      if (refRes.status === 'fulfilled') setReferrals(refRes.value.data || []);
      if (assocRes.status === 'fulfilled') setAssociations(assocRes.value.data || []);
      if (transRes.status === 'fulfilled') setTransfers(transRes.value.data || []);
      if (docRes.status === 'fulfilled') setColleagueDoctors(docRes.value.data || []);
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

  // Fetch Patient Personal Health Record from MediTrack DB
  const fetchPatientHealth = async (targetId) => {
    if (!targetId) return;
    setLoadingPatientHealth(true);
    try {
      const res = await api.get(`/appointments/patient-health-summary/${targetId}`);
      if (res.data?.success) {
        setSelectedPatientHealth(res.data);
      }
    } catch (err) {
      console.warn('Patient health summary fetch error:', err.message);
    } finally {
      setLoadingPatientHealth(false);
    }
  };

  // Import Active Meds from MediTrack into Prescription Form
  const handleImportActiveMeds = () => {
    if (!selectedPatientHealth?.activeMedications || selectedPatientHealth.activeMedications.length === 0) return;
    const importedMeds = selectedPatientHealth.activeMedications.map(m => ({
      name: m.name,
      dosage: m.dosage || '500mg',
      frequency: '1-0-1',
      duration: '5 days'
    }));
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: importedMeds
    }));
  };

  // Automatically fetch patient health summary when appointment selected or queue loads
  useEffect(() => {
    if (prescriptionForm.appointmentId) {
      fetchPatientHealth(prescriptionForm.appointmentId);
    } else if (queue?.entries?.length > 0) {
      const activeEntry = queue.entries.find(e => e.status === 'IN_CONSULTATION') || queue.entries.find(e => e.status === 'WAITING');
      if (activeEntry?.patientId?._id || activeEntry?.patientId) {
        fetchPatientHealth(activeEntry.patientId._id || activeEntry.patientId);
      } else {
        setSelectedPatientHealth(null);
      }
    } else {
      setSelectedPatientHealth(null);
    }
  }, [prescriptionForm.appointmentId, queue]);

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

    if (!prescriptionForm.isOfflinePrescription) {
      if (!prescriptionForm.diagnosis.trim()) {
        return alert('Please enter a Diagnosis for online prescription');
      }
      const validMeds = prescriptionForm.medicines.filter(m => m.name.trim().length > 0);
      if (validMeds.length === 0) {
        return alert('Please add at least one medicine with a name for online prescription');
      }
    }

    try {
      await api.put(`/appointments/${prescriptionForm.appointmentId}/status`, {
        status: 'COMPLETED',
        prescription: prescriptionForm,
      });
      alert(`Prescription issued (${prescriptionForm.isOfflinePrescription ? 'Offline Handwritten' : 'Online Digital PDF'}) & saved to patient Care Journey! Email PDF generated & sent.`);
      setPrescriptionForm({
        appointmentId: '',
        isOfflinePrescription: false,
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

  // Submit New Clinical Referral or Doctor Advice Request
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!referralForm.patientId) {
      return alert('Please select a patient for referral/consultation.');
    }

    const isInternal = referralModalType === 'INTRA_HOSPITAL';
    const myFacilityId = user?.facilityId || (typeof associations[0]?.facilityId === 'object' ? associations[0]?.facilityId?._id : associations[0]?.facilityId) || (facilities[0]?._id || facilities[0]?.facilityId);

    if (!isInternal && !referralForm.receivingFacilityId) {
      return alert('Please select a receiving healthcare facility for inter-hospital transfer.');
    }

    if (!isInternal && familyConsent.consentGiven && !familyConsent.familyMemberName) {
      return alert('Please enter patient family member name for family consent verification.');
    }

    try {
      if (!isInternal) {
        // Create emergency hospital transfer
        await api.post('/transfers', {
          patientId: referralForm.patientId,
          originatingFacilityId: myFacilityId,
          destinationFacilityId: referralForm.receivingFacilityId,
          referringDoctorId: doctorId,
          reason: referralForm.reason || 'Emergency Inter-Hospital Transfer',
          clinicalSummary: referralForm.clinicalNotes || referralForm.reason || 'Emergency Inter-Hospital Transfer Request',
          urgency: referralForm.urgency === 'EMERGENCY' ? 'CRITICAL' : 'URGENT',
          requiredDepartment: referralForm.department || 'Emergency Trauma',
          patientFamilyConsent: familyConsent,
          isInterState: isInterStateConfirmed,
          interStateDoctorConfirmation: {
            confirmed: isInterStateConfirmed,
            doctorId: doctorId,
            confirmedAt: new Date(),
            clinicalJustification: interStateJustification || 'Doctor clinical sign-off provided',
          },
        });
      }

      await api.post('/referrals', {
        patientId: referralForm.patientId,
        referringFacilityId: myFacilityId,
        receivingFacilityId: isInternal ? myFacilityId : referralForm.receivingFacilityId,
        targetDoctorId: isInternal ? targetDoctorId : null,
        referralType: isInternal ? 'DOCTOR_CONSULTATION' : 'HOSPITAL_REFERRAL',
        referralScope: isInternal ? 'INTRA_HOSPITAL' : 'INTER_HOSPITAL',
        department: referralForm.department || 'General Medicine',
        urgency: referralForm.urgency || 'ROUTINE',
        reason: referralForm.reason || 'Specialist Clinical Consultation Request',
        clinicalNotes: referralForm.clinicalNotes || '',
        patientFamilyConsent: familyConsent,
        isInterState: isInterStateConfirmed,
        interStateConfirmation: {
          confirmed: isInterStateConfirmed,
          doctorNotes: interStateJustification || 'Doctor clinical sign-off provided',
          doctorConfirmedAt: new Date(),
        },
      });

      alert(isInternal 
        ? '✓ Intra-Hospital Doctor Consultation Request dispatched! Email & in-app notification sent.'
        : '✓ Inter-Hospital Patient Referral & Emergency Transfer dispatched! Gmail notification sent.'
      );
      setShowReferralModal(false);
      loadDoctorData();
    } catch (err) {
      console.error('Referral dispatch error:', err);
      alert(err.response?.data?.message || 'Failed to dispatch referral request.');
    }
  };

  // Submit Doctor Consultation Advice / Opinion
  const handleSubmitAdvice = async (e) => {
    e.preventDefault();
    if (!selectedReferralForAdvice) return;
    try {
      await api.put(`/referrals/${selectedReferralForAdvice._id}/advice`, adviceForm);
      alert('✓ Specialist Consultation Advice submitted successfully! Patient & referring doctor notified.');
      setShowAdviceModal(false);
      setSelectedReferralForAdvice(null);
      setAdviceForm({ adviceNotes: '', recommendedDiagnosis: '', recommendedTreatment: '' });
      loadDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit consultation advice.');
    }
  };

  const handleDeleteReferral = async (referralId) => {
    if (!window.confirm('Are you sure you want to delete this referral record? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/referrals/${referralId}`);
      setReferrals(prev => prev.filter(r => r._id !== referralId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete referral record.');
    }
  };

  const handleCompleteReferral = async (referralId) => {
    const notes = window.prompt('Enter doctor completion & sign-off notes (optional):', 'Referral consultation completed, patient evaluated & treated.');
    if (notes === null) return;

    try {
      await api.put(`/referrals/${referralId}/complete`, { completionNotes: notes });
      alert('✓ Referral confirmed as COMPLETED by doctor! Patient referral status updated.');
      loadDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete referral');
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
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col md:flex-row relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Grainy Texture Overlay */}
      <div className="grainy-overlay" />

      {/* Floating Ambient Mesh Orbs */}
      <div className="ambient-orb-cyan -top-20 -left-20 animate-float-slow" />
      <div className="ambient-orb-teal bottom-10 right-10 animate-float-reverse" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 liquid-glass border-r border-white/10 p-6 flex flex-col justify-between shrink-0 relative z-20 backdrop-blur-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-display text-sm font-extrabold text-white truncate max-w-[140px]">
                {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
              </h2>
              <span className="text-[10px] font-tech text-cyan-400 font-semibold block truncate uppercase tracking-wider">
                {doctorSpec}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-tech font-semibold">
            {[
              { id: 'queue', label: 'Clinical Queue', icon: Clock, badge: queue?.entries?.length || 0 },
              { id: 'teleconsultation', label: 'Teleconsultation Room', icon: Video, badge: teleSessions.filter(s => s.status === 'CONFIRMED' || s.status === 'PENDING').length },
              { id: 'appointments', label: 'My Appointments', icon: Calendar, badge: appointments.length },
              { id: 'referrals', label: 'My Referrals', icon: FileText, badge: referrals.filter(r => r.status !== 'COMPLETED').length },
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDoctorHistoryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-semibold flex items-center gap-2 border border-teal-500/30 transition shadow-sm"
              title="Open Clinical History Archive Modal"
            >
              <History className="w-3.5 h-3.5 text-teal-400" /> History ({teleSessions.filter(s => s.status === 'CLOSED' || s.status === 'COMPLETED').length + referrals.filter(r => r.status === 'COMPLETED').length})
            </button>
            <button onClick={loadDoctorData} className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800 transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
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
              {/* Left Column: Waiting Queue List + Patient Personal Health Record Widget */}
              <div className="space-y-6">
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
                        <div
                          key={e._id}
                          onClick={() => fetchPatientHealth(e.patientId?._id || e.patientId)}
                          className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer transition"
                          title="Click to view Patient Personal Health Record"
                        >
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

                {/* ----------------- MEDITRACK PATIENT PERSONAL HEALTH RECORD WIDGET ----------------- */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Heart className="w-5 h-5 text-cyan-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Patient Personal Health Record
                        </h3>
                        <p className="text-[11px] text-slate-400">Fetched from patient's MediTrack health vault</p>
                      </div>
                    </div>

                    {selectedPatientHealth && (
                      <button
                        type="button"
                        onClick={() => setShowFullEhrModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition flex items-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Full EHR Dossier
                      </button>
                    )}
                  </div>

                  {loadingPatientHealth ? (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Querying MediTrack Health Database for Patient Vitals & Records...</p>
                    </div>
                  ) : selectedPatientHealth ? (
                    <div className="space-y-4">
                      {/* Patient Health Overview Banner */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {selectedPatientHealth.patient?.profilePictureUrl || selectedPatientHealth.mediTrackUser?.profilePictureUrl ? (
                            <img
                              src={selectedPatientHealth.patient?.profilePictureUrl || selectedPatientHealth.mediTrackUser?.profilePictureUrl}
                              alt={selectedPatientHealth.patient?.name || 'Patient'}
                              className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-lg flex items-center justify-center shrink-0">
                              {selectedPatientHealth.patient?.name?.charAt(0) || 'P'}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-extrabold text-white flex items-center gap-2">
                              {selectedPatientHealth.patient?.name}
                              {selectedPatientHealth.mediTrackUser?.isLinked && (
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                                  VERIFIED PATIENT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>ABHA: <strong className="text-slate-200">{selectedPatientHealth.mediTrackUser?.abhaNumber || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Blood Group: <strong className="text-rose-400">{selectedPatientHealth.patient?.bloodGroup || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Age/Gender: <strong className="text-slate-200">{selectedPatientHealth.patient?.age ? `${selectedPatientHealth.patient.age}Y` : 'N/A'} / {selectedPatientHealth.patient?.gender || 'N/A'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Health Score & Vitals */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-medium">HEALTH SCORE</div>
                            <div className="text-2xl font-black text-emerald-400 flex items-center justify-end gap-1">
                              {selectedPatientHealth.mediTrackUser?.healthScore || 90}
                              <span className="text-xs font-semibold text-slate-500">/100</span>
                            </div>
                          </div>

                          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                            <div className="text-[10px] text-slate-400 font-medium">STATUS</div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold block mt-0.5 ${
                              selectedPatientHealth.mediTrackUser?.healthState === 'GREEN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              selectedPatientHealth.mediTrackUser?.healthState === 'YELLOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {selectedPatientHealth.mediTrackUser?.healthState || 'GREEN'}
                            </span>
                          </div>

                          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                            <div className="text-[10px] text-slate-400 font-medium">BMI INDEX</div>
                            <div className="text-xs font-bold text-cyan-300 mt-0.5">{selectedPatientHealth.mediTrackUser?.bmi || 23.5}</div>
                          </div>
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setPatientHealthTab('MEDS')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                            patientHealthTab === 'MEDS' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Pill className="w-3.5 h-3.5" /> Active Meds ({selectedPatientHealth.activeMedications?.length || 0})
                        </button>

                        <button
                          type="button"
                          onClick={() => setPatientHealthTab('REPORTS')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                            patientHealthTab === 'REPORTS' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Reports ({selectedPatientHealth.previousReports?.length || 0})
                        </button>

                        <button
                          type="button"
                          onClick={() => setPatientHealthTab('GENETICS')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                            patientHealthTab === 'GENETICS' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Dna className="w-3.5 h-3.5" /> Genetics & Inborn ({selectedPatientHealth.geneticAndInbornIssues?.length || 0})
                        </button>

                        <button
                          type="button"
                          onClick={() => setPatientHealthTab('HEALTH')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                            patientHealthTab === 'HEALTH' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Chronic & Ayurveda
                        </button>

                        <button
                          type="button"
                          onClick={() => setPatientHealthTab('VITALS')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                            patientHealthTab === 'VITALS' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" /> Daily Vitals
                        </button>
                      </div>

                      {/* TAB CONTENT 1: ACTIVE MEDICATIONS */}
                      {patientHealthTab === 'MEDS' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400">Current Active User Medications</span>
                            {selectedPatientHealth.activeMedications?.length > 0 && (
                              <button
                                type="button"
                                onClick={handleImportActiveMeds}
                                className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-[11px] border border-teal-500/30 transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Import All to Prescription Writer
                              </button>
                            )}
                          </div>

                          {selectedPatientHealth.activeMedications?.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                              No active medications logged in MediTrack database.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                              {selectedPatientHealth.activeMedications.map((m, idx) => (
                                <div key={m._id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="font-extrabold text-white text-xs flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                      {m.name} <span className="text-cyan-400 font-semibold">({m.dosage})</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                                      <span>Generic: <strong className="text-slate-300">{m.genericName || m.name}</strong></span>
                                      <span>•</span>
                                      <span>Form: <strong className="text-slate-300">{m.form || 'Tablet'}</strong></span>
                                      <span>•</span>
                                      <span>Qty: <strong className="text-emerald-400">{m.quantity} remaining</strong></span>
                                    </div>
                                    {m.aiInsights?.recommendation && (
                                      <div className="text-[10px] text-amber-300 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                                        💡 AI Note: {m.aiInsights.recommendation}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrescriptionForm(prev => ({
                                        ...prev,
                                        medicines: [...prev.medicines, { name: m.name, dosage: m.dosage || '500mg', frequency: '1-0-1', duration: '5 days' }]
                                      }));
                                    }}
                                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-[10px] border border-cyan-500/30 transition shrink-0"
                                  >
                                    + Add to Rx
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB CONTENT 2: PREVIOUS LAB REPORTS */}
                      {patientHealthTab === 'REPORTS' && (
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 block">Uploaded Lab & Diagnostic Reports (AI Analyzed)</span>
                          {selectedPatientHealth.previousReports?.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                              No previous lab reports stored in MediTrack database.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
                              {selectedPatientHealth.previousReports.map((r, idx) => (
                                <div key={r._id || idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-extrabold text-white text-xs flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-cyan-400" />
                                        {r.folderName}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        Domain: <strong className="text-cyan-300">{r.domain}</strong> • Date: <strong className="text-slate-300">{new Date(r.reportDate).toLocaleDateString()}</strong>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                                        AI Score: {r.aiAnalysis?.healthScore || 90}
                                      </span>
                                      {r.files?.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedReportModal(r)}
                                          className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 transition flex items-center gap-1"
                                        >
                                          <Maximize2 className="w-3 h-3" /> View Document
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {r.aiAnalysis?.summary && (
                                    <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 leading-relaxed">
                                      <strong className="text-cyan-400">AI Diagnostic Summary:</strong> {r.aiAnalysis.summary}
                                    </p>
                                  )}

                                  {r.aiAnalysis?.keyFindings?.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                      <div className="text-[10px] font-bold text-slate-400">KEY BIOMARKER FINDINGS:</div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {r.aiAnalysis.keyFindings.map((kf, kIdx) => (
                                          <span key={kIdx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                                            • {kf}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB CONTENT 3: GENETICS & INBORN DISEASES */}
                      {patientHealthTab === 'GENETICS' && (
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-slate-400 block">Genomic Predispositions & Inborn Condition Insights</span>

                          {!selectedPatientHealth.geneticAndInbornIssues || selectedPatientHealth.geneticAndInbornIssues.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 font-medium">
                              No genetic or inborn condition data logged for this patient (null).
                            </div>
                          ) : (
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                              {selectedPatientHealth.geneticAndInbornIssues.map((g, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                                      <Dna className="w-4 h-4 text-amber-400" />
                                      {g.condition}
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                      {g.category || 'Genomics'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                                    <strong className="text-slate-400">Clinical Recommendation:</strong> {g.recommendation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Family History */}
                          {selectedPatientHealth.mediTrackUser?.familyMedicalHistory?.length > 0 && (
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-cyan-400" /> Family Medical History (Inherited Risks)
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {selectedPatientHealth.mediTrackUser.familyMedicalHistory.map((fm, fIdx) => (
                                  <span key={fIdx} className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-medium">
                                    ⚠️ {fm}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB CONTENT 4: CHRONIC & AYURVEDA */}
                      {patientHealthTab === 'HEALTH' && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                              <span className="text-[10px] font-bold text-rose-400 block">KNOWN ALLERGIES</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedPatientHealth.patient?.allergies?.map((a, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                                    ⛔ {a}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                              <span className="text-[10px] font-bold text-amber-400 block">CHRONIC CONDITIONS</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedPatientHealth.patient?.chronicConditions?.map((c, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                                    🩺 {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Dosha & Lifestyle */}
                          {selectedPatientHealth.ayurvedicAndLifestyle && (
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ayurvedic Dosha Profile
                                </span>
                                <span className="text-cyan-400 font-bold text-xs">
                                  {selectedPatientHealth.ayurvedicAndLifestyle.dosha?.primary || 'Pitta-Vata'}
                                </span>
                              </div>

                              {/* Progress bars for Dosha */}
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-slate-400"><span>Vata</span><span>{selectedPatientHealth.ayurvedicAndLifestyle.dosha?.vata || 35}%</span></div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${selectedPatientHealth.ayurvedicAndLifestyle.dosha?.vata || 35}%` }} />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-slate-400"><span>Pitta</span><span>{selectedPatientHealth.ayurvedicAndLifestyle.dosha?.pitta || 50}%</span></div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${selectedPatientHealth.ayurvedicAndLifestyle.dosha?.pitta || 50}%` }} />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-slate-400"><span>Kapha</span><span>{selectedPatientHealth.ayurvedicAndLifestyle.dosha?.kapha || 15}%</span></div>
                                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${selectedPatientHealth.ayurvedicAndLifestyle.dosha?.kapha || 15}%` }} />
                                  </div>
                                </div>
                              </div>

                              {selectedPatientHealth.ayurvedicAndLifestyle.healingPath?.title && (
                                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                                  <strong className="text-amber-300">Targeted Wellness Regimen:</strong> {selectedPatientHealth.ayurvedicAndLifestyle.healingPath.title} — {selectedPatientHealth.ayurvedicAndLifestyle.healingPath.description}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB CONTENT 5: DAILY VITALS & LOGS */}
                      {patientHealthTab === 'VITALS' && (
                        <div className="space-y-3 text-xs">
                          <span className="text-xs font-semibold text-slate-400 block">Recent Patient Self-Logged Daily Vitals</span>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {selectedPatientHealth.recentVitals?.map((v, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">{new Date(v.date).toLocaleDateString()}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold capitalize">
                                      Mood: {v.mood}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                      Energy: {v.energyLevel}/10
                                    </span>
                                  </div>
                                </div>

                                {v.bodyStatus?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {v.bodyStatus.map((bs, bIdx) => (
                                      <span key={bIdx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                                        • {bs}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {v.notes && <p className="text-[11px] text-slate-400 italic">"{v.notes}"</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                      No active consultation loaded. Call next patient or select a queue entry to view their MediTrack Personal Health Record.
                    </div>
                  )}
                </div>
              </div>

              {/* Prescription Writer */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Issue Clinical Prescription to Care Journey</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prescriptionForm.isOfflinePrescription ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                    {prescriptionForm.isOfflinePrescription ? 'Offline Paper Mode' : 'Online PDF Mode'}
                  </span>
                </h3>

                <form onSubmit={handlePrescriptionSubmit} className="space-y-3 text-xs">
                  {/* Offline Prescription Toggle Switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="font-bold text-white text-xs block">Offline Prescription Given (Hardcopy Handed to Patient)</span>
                      <span className="text-[10px] text-slate-400">If enabled, online diagnosis & medicine entries become optional.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prescriptionForm.isOfflinePrescription}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, isOfflinePrescription: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Select Patient Appointment *</label>
                    <select
                      value={prescriptionForm.appointmentId}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, appointmentId: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Choose Patient Appointment --</option>
                      {appointments
                        .filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
                        .map(a => (
                          <option key={a._id} value={a._id}>
                            Token #{a.tokenNumber || 1} - {a.patientName || a.patientId?.name || 'Patient'} ({a.timeSlot || '09:30 AM'} - {a.status || 'CONFIRMED'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">
                      Diagnosis {prescriptionForm.isOfflinePrescription ? '(Optional for Offline)' : '*'}
                    </label>
                    <input
                      type="text"
                      value={prescriptionForm.diagnosis}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                      required={!prescriptionForm.isOfflinePrescription}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      placeholder={prescriptionForm.isOfflinePrescription ? "e.g. Hardcopy Rx #1092 issued at counter (Optional)" : "Hypertension & Recurrent Angina"}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-slate-400 font-semibold">
                        Medicines & Dosage {prescriptionForm.isOfflinePrescription ? '(Optional)' : '*'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMedicineRow}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center gap-1 border border-teal-500/30 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Medicine
                      </button>
                    </div>

                    {prescriptionForm.medicines.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <div className="grid grid-cols-4 gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="Medicine Name"
                            value={m.name}
                            onChange={e => {
                              const newMeds = [...prescriptionForm.medicines];
                              newMeds[idx].name = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                            }}
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            placeholder="Dosage (500mg)"
                            value={m.dosage}
                            onChange={e => {
                              const newMeds = [...prescriptionForm.medicines];
                              newMeds[idx].dosage = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                            }}
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            placeholder="Frequency (1-0-1)"
                            value={m.frequency}
                            onChange={e => {
                              const newMeds = [...prescriptionForm.medicines];
                              newMeds[idx].frequency = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                            }}
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            placeholder="Duration (5 days)"
                            value={m.duration}
                            onChange={e => {
                              const newMeds = [...prescriptionForm.medicines];
                              newMeds[idx].duration = e.target.value;
                              setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                            }}
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500"
                          />
                        </div>

                        {prescriptionForm.medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition"
                            title="Remove medicine"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Doctor Clinical Advice / Notes</label>
                    <textarea
                      rows={2}
                      value={prescriptionForm.advice}
                      onChange={e => setPrescriptionForm({ ...prescriptionForm, advice: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Lifestyle guidance, follow-up date, or offline Rx notes..."
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-lg transition ${
                      prescriptionForm.isOfflinePrescription
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {prescriptionForm.isOfflinePrescription
                        ? 'Confirm & Save Offline Prescription to Care Journey'
                        : 'Issue Online Digital PDF Prescription & Email Patient'}
                    </span>
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

        {/* ----------------- TAB 4: MY REFERRALS & ADVICE ----------------- */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 text-xs">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex space-x-2">
                {[
                  { id: 'ALL', label: 'All Referrals' },
                  { id: 'INTRA_HOSPITAL', label: 'Intra-Hospital Advice' },
                  { id: 'INTER_HOSPITAL', label: 'Inter-Hospital Transfers' },
                  { id: 'ADVICE', label: 'Advice Requests Received' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReferralFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl font-bold transition ${referralFilter === tab.id ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setReferralModalType('INTRA_HOSPITAL');
                  fetchFacilitiesForState(targetState);
                  setShowReferralModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" /> Create Referral / Advice Request
              </button>
            </div>

            {/* Referrals & Transfers List */}
            <div className="space-y-4">
              {referrals.filter(r => r.status !== 'COMPLETED').length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-medium">No active clinical referrals or consultation advice requests logged.</p>
                  {referrals.filter(r => r.status === 'COMPLETED').length > 0 && (
                    <button
                      onClick={() => {
                        setDoctorHistoryTab('REFERRALS');
                        setShowDoctorHistoryModal(true);
                      }}
                      className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl font-bold text-xs inline-flex items-center gap-2"
                    >
                      <History className="w-4 h-4" /> View Completed Referral History ({referrals.filter(r => r.status === 'COMPLETED').length})
                    </button>
                  )}
                </div>
              ) : (
                referrals
                  .filter(r => r.status !== 'COMPLETED')
                  .filter(r => {
                    if (referralFilter === 'INTRA_HOSPITAL') return r.referralScope === 'INTRA_HOSPITAL';
                    if (referralFilter === 'INTER_HOSPITAL') return r.referralScope === 'INTER_HOSPITAL';
                    if (referralFilter === 'ADVICE') return r.targetDoctorId?._id === doctorId || r.targetDoctorId === doctorId;
                    return true;
                  })
                  .map(r => {
                    const isIncomingAdviceForMe = (r.targetDoctorId?._id === doctorId || r.targetDoctorId === doctorId) && r.status !== 'ADVICE_PROVIDED';

                    return (
                      <div key={r._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl relative overflow-hidden">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0">
                                🆔 Referral ID: {r.referralId || `REF-${r._id?.toString()?.slice(-6)?.toUpperCase() || r._id}`}
                              </span>
                              <span className="text-base font-bold text-white">{r.patientId?.name || 'Patient'}</span>
                              <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] ${r.referralScope === 'INTRA_HOSPITAL' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                                {r.referralScope === 'INTRA_HOSPITAL' ? 'Intra-Hospital Advice' : 'Inter-Hospital Transfer'}
                              </span>
                              {r.isInterState && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/30">
                                  ⚠️ Inter-State Transfer
                                </span>
                              )}
                              {r.patientFamilyConsent?.consentGiven && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                  ✓ Family Consented
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-xs flex items-center gap-2">
                              <span>Referring Dr: <strong className="text-slate-200">Dr. {r.referringDoctorId?.fullName || 'Attending Physician'}</strong></span>
                              <span>•</span>
                              <span>Target Hospital: <strong className="text-cyan-400">{r.receivingFacilityId?.name || 'Care Facility'}</strong></span>
                              {r.targetDoctorId && (
                                <>
                                  <span>•</span>
                                  <span>Consulting Specialist: <strong className="text-purple-300">Dr. {r.targetDoctorId?.fullName}</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${r.urgency === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                              {r.urgency} URGENCY
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
                              {r.status}
                            </span>
                            <button
                              onClick={() => handleDeleteReferral(r._id)}
                              title="Delete Referral Record"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                          <div>Department: <strong className="text-slate-100">{r.department}</strong></div>
                          <div>Clinical Reason: <i className="text-slate-300">"{r.reason}"</i></div>
                          {r.clinicalNotes && <div className="text-slate-400 text-[11px]">Notes: {r.clinicalNotes}</div>}
                        </div>

                        {/* Consultation Advice View if submitted */}
                        {r.consultationAdvice?.adviceNotes && (
                          <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs space-y-1 text-teal-200">
                            <div className="font-bold flex items-center gap-1.5 text-teal-300">
                              <CheckCircle className="w-4 h-4 text-teal-400" /> Specialist Consultation Opinion (Dr. {r.consultationAdvice.providedBy?.fullName || 'Specialist'})
                            </div>
                            <div><strong>Clinical Opinion:</strong> {r.consultationAdvice.adviceNotes}</div>
                            {r.consultationAdvice.recommendedTreatment && (
                              <div><strong>Recommended Treatment:</strong> {r.consultationAdvice.recommendedTreatment}</div>
                            )}
                          </div>
                        )}

                        {/* Action buttons for Doctor */}
                        <div className="pt-2 flex flex-wrap justify-end gap-2">
                          {isIncomingAdviceForMe && (
                            <button
                              onClick={() => {
                                setSelectedReferralForAdvice(r);
                                setShowAdviceModal(true);
                              }}
                              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                            >
                              <FileText className="w-4 h-4" /> Provide Specialist Advice / Opinion
                            </button>
                          )}

                          {r.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => handleCompleteReferral(r._id)}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-4 h-4 text-slate-950" /> Confirm Referral Completed
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Completed & Confirmed by Doctor
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Create Referral & Advice Modal */}
            {showReferralModal && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full space-y-4 my-8 text-xs shadow-2xl">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-cyan-400" /> Dispatch Patient Referral & Consultation
                    </h3>
                    <button onClick={() => !isFetching && setShowReferralModal(false)} disabled={isFetching} className="text-slate-400 hover:text-white disabled:opacity-50">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mode Selector Segmented Switch */}
                  <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                    <button
                      type="button"
                      disabled={isFetching}
                      onClick={() => setReferralModalType('INTRA_HOSPITAL')}
                      className={`py-2 rounded-xl font-bold transition disabled:opacity-50 ${referralModalType === 'INTRA_HOSPITAL' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Intra-Hospital Advice (Same Hospital)
                    </button>
                    <button
                      type="button"
                      disabled={isFetching}
                      onClick={() => {
                        setReferralModalType('INTER_HOSPITAL');
                        fetchFacilitiesForLocation(locationSearchQuery);
                      }}
                      className={`py-2 rounded-xl font-bold transition disabled:opacity-50 ${referralModalType === 'INTER_HOSPITAL' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Inter-Hospital & State Transfer
                    </button>
                  </div>

                  {/* Pulsing Fetching Status Banner */}
                  {isFetching && (
                    <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-cyan-500/10 animate-pulse">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                        <span>Fetching organization details & available doctors... Form controls disabled until complete.</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold shrink-0">Please Wait</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateReferral} className="space-y-4">
                    {referralModalType === 'INTRA_HOSPITAL' ? (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Select Patient *</label>
                          <select
                            value={referralForm.patientId}
                            onChange={e => setReferralForm({ ...referralForm, patientId: e.target.value })}
                            required
                            disabled={isFetching}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium disabled:opacity-50"
                          >
                              <option value="">-- Choose Patient --</option>
                              {appointments
                                .filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
                                .map(a => {
                                  const patId = a.patientId?._id || (typeof a.patientId === 'string' ? a.patientId : a._id);
                                  const patName = a.patientId?.name || a.patientId?.fullName || a.patientName || 'Patient';
                                  return (
                                    <option key={a._id} value={patId}>
                                      {patName} ({a.department || 'General Medicine'})
                                    </option>
                                  );
                                })}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Target Department *</label>
                            <input
                              type="text"
                              value={referralForm.department}
                              onChange={e => setReferralForm({ ...referralForm, department: e.target.value })}
                              required
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium disabled:opacity-50"
                              placeholder="e.g. Cardiology, Neurology"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Consulting Specialist Doctor</label>
                            <select
                              value={targetDoctorId}
                              onChange={e => setTargetDoctorId(e.target.value)}
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium disabled:opacity-50"
                            >
                              <option value="">-- Any Available Specialist --</option>
                              {colleagueDoctors.map(d => {
                                const cleanName = (d.fullName || '').replace(/^Dr\.\s*/i, '');
                                return (
                                  <option key={d._id} value={d._id}>Dr. {cleanName} ({d.specialization})</option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Urgency Level *</label>
                            <select
                              value={referralForm.urgency}
                              onChange={e => setReferralForm({ ...referralForm, urgency: e.target.value })}
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                            >
                              <option value="ROUTINE">ROUTINE</option>
                              <option value="URGENT">URGENT</option>
                              <option value="EMERGENCY">EMERGENCY</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Clinical Reason *</label>
                            <input
                              type="text"
                              value={referralForm.reason}
                              onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })}
                              required
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                              placeholder="Clinical rationale..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Detailed Case Summary</label>
                          <textarea
                            rows={2}
                            value={referralForm.clinicalNotes}
                            onChange={e => setReferralForm({ ...referralForm, clinicalNotes: e.target.value })}
                            disabled={isFetching}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                            placeholder="Vitals, lab findings, initial diagnosis..."
                          />
                        </div>
                      </div>
                    ) : (
                      /* WIDER 2-COLUMN LAYOUT FOR INTER-HOSPITAL & STATE TRANSFER */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* COLUMN 1: Location, Hospital Selection, Family Consent */}
                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Select Patient *</label>
                            <select
                              value={referralForm.patientId}
                              onChange={e => setReferralForm({ ...referralForm, patientId: e.target.value })}
                              required
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                            >
                              <option value="">-- Choose Patient --</option>
                              {appointments
                                .filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
                                .map(a => {
                                  const patId = a.patientId?._id || (typeof a.patientId === 'string' ? a.patientId : a._id);
                                  const patName = a.patientId?.name || a.patientId?.fullName || a.patientName || 'Patient';
                                  return (
                                    <option key={a._id} value={patId}>
                                      {patName} ({a.department || 'General Medicine'})
                                    </option>
                                  );
                                })}
                            </select>
                          </div>

                          {/* Dynamic Location Search Input */}
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Search Target Location (State / City / District) *</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={locationSearchQuery}
                                  onChange={e => setLocationSearchQuery(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      fetchFacilitiesForLocation(locationSearchQuery);
                                    }
                                  }}
                                  placeholder="Type State or City e.g. Delhi, Kolkata, Bankura, Mumbai"
                                  disabled={isFetching}
                                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                              </div>
                              <button
                                type="button"
                                onClick={() => fetchFacilitiesForLocation(locationSearchQuery)}
                                disabled={isFetching}
                                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                              >
                                {isSearchingLocation ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Fetch Hospitals
                              </button>
                            </div>
                          </div>

                          {/* Target Healthcare Facility Dropdown */}
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Available Hospitals in '{locationSearchQuery}' *</label>
                            <select
                              value={referralForm.receivingFacilityId}
                              onChange={e => {
                                const facId = e.target.value;
                                const currentList = targetStateFacilities.length > 0 ? targetStateFacilities : facilities;
                                const chosenFac = currentList.find(f => (f._id || f.facilityId) === facId);

                                if (chosenFac && (!chosenFac.isMediTrackVerified || chosenFac.canSelect === false)) {
                                  toast.error('This hospital is not MediTrack Verified. Referrals can only be dispatched to MediTrack Verified facilities.');
                                  return;
                                }

                                setReferralForm({ ...referralForm, receivingFacilityId: facId });
                                fetchDoctorsForFacility(facId, locationSearchQuery);
                              }}
                              required
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                            >
                              <option value="">-- Select MediTrack Verified Hospital --</option>
                              
                              <optgroup label="🟢 MediTrack Verified Hospitals (Selectable)">
                                {(targetStateFacilities.length > 0 ? targetStateFacilities : facilities)
                                  .filter(f => f.isMediTrackVerified && f.canSelect !== false)
                                  .map(f => (
                                    <option key={f._id || f.facilityId} value={f._id || f.facilityId}>
                                      🟢 [MediTrack Verified ✓] {f.name} ({f.district || f.state || 'Registered'})
                                    </option>
                                  ))
                                }
                              </optgroup>

                              <optgroup label="🔴 Unverified Locality Map Hospitals (Disabled - Selection Restricted)">
                                {(targetStateFacilities.length > 0 ? targetStateFacilities : facilities)
                                  .filter(f => !f.isMediTrackVerified || f.canSelect === false)
                                  .map(f => (
                                    <option key={f._id || f.facilityId} value={f._id || f.facilityId} disabled={true}>
                                      🔴 [Unverified - Selection Disabled] {f.name} ({f.district || f.state || 'Map Location'})
                                    </option>
                                  ))
                                }
                              </optgroup>
                            </select>
                          </div>

                          {/* Unverified Hospitals Banner */}
                          {(targetStateFacilities.length > 0 ? targetStateFacilities : facilities).some(f => !f.isMediTrackVerified || f.canSelect === false) && (
                            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>
                                <strong>Verification Standard:</strong> Map hospitals not registered in MediTrack are shown as disabled options (🔴). Electronic referrals are strictly enabled for MediTrack Verified facilities (🟢).
                              </span>
                            </div>
                          )}

                          {/* Mandatory Patient Family Consent Box */}
                          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={familyConsent.consentGiven}
                                  onChange={e => setFamilyConsent({ ...familyConsent, consentGiven: e.target.checked })}
                                  disabled={isFetching}
                                  className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 disabled:opacity-50"
                                />
                                <span className="font-bold text-teal-300">Patient Family Consent Obtained *</span>
                              </label>
                              <span className="text-[10px] text-slate-400">Mandatory Healthcare Standard</span>
                            </div>

                            {familyConsent.consentGiven && (
                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Family Member Full Name *"
                                  value={familyConsent.familyMemberName}
                                  onChange={e => setFamilyConsent({ ...familyConsent, familyMemberName: e.target.value })}
                                  required
                                  disabled={isFetching}
                                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs disabled:opacity-50"
                                />
                                <input
                                  type="text"
                                  placeholder="Relationship (e.g. Spouse)"
                                  value={familyConsent.familyRelation}
                                  onChange={e => setFamilyConsent({ ...familyConsent, familyRelation: e.target.value })}
                                  disabled={isFetching}
                                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs disabled:opacity-50"
                                />
                                <input
                                  type="tel"
                                  placeholder="Family Phone Number"
                                  value={familyConsent.familyContact}
                                  onChange={e => setFamilyConsent({ ...familyConsent, familyContact: e.target.value })}
                                  disabled={isFetching}
                                  className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs disabled:opacity-50"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* COLUMN 2: Target Doctor, Doctors Present Grid, Department & Clinical Details */}
                        <div className="space-y-3.5">
                          {/* Consulting Specialist Doctor Dropdown */}
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Select Target Specialist Doctor ({locationSearchQuery})</label>
                            <select
                              value={targetDoctorId}
                              onChange={e => setTargetDoctorId(e.target.value)}
                              disabled={isFetching}
                              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                            >
                              <option value="">-- Any Available Hospital Specialist --</option>
                              {targetFacilityDoctors.map(d => {
                                const cleanName = (d.fullName || '').replace(/^Dr\.\s*/i, '');
                                return (
                                  <option key={d._id} value={d._id}>
                                    Dr. {cleanName} ({d.specialization} - {d.associatedFacilities?.[0]?.facilityName || 'Specialist'})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Visual Card List of Doctors Present in Organization */}
                          {targetFacilityDoctors.length > 0 && (
                            <div className={`space-y-2 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
                              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                                <span className="flex items-center gap-1.5 text-cyan-400">
                                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                                  Doctors Present in Organization ({targetFacilityDoctors.length})
                                </span>
                                <span className="text-[10px] text-teal-400 font-medium">MediTrack Verified Specialists ✓</span>
                              </div>

                              <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                                {targetFacilityDoctors.map(doc => {
                                  const cleanName = (doc.fullName || '').replace(/^Dr\.\s*/i, '');
                                  const isSelected = targetDoctorId === doc._id;
                                  const assoc = doc.associatedFacilities?.[0];

                                  return (
                                    <div
                                      key={doc._id}
                                      onClick={() => !isFetching && setTargetDoctorId(doc._id)}
                                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-cyan-950/40 border-cyan-500/80 shadow-sm shadow-cyan-500/10'
                                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                                          {cleanName.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-xs">Dr. {cleanName}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-teal-950 border border-teal-500/30 text-teal-300 font-semibold">
                                              {assoc?.designation || 'Specialist'}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-cyan-300 font-medium">{doc.specialization}</div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 pl-2">
                                        <input
                                          type="radio"
                                          name="selectedTargetDoctor"
                                          checked={isSelected}
                                          disabled={isFetching}
                                          onChange={() => setTargetDoctorId(doc._id)}
                                          className="w-4 h-4 text-cyan-500 accent-cyan-500 cursor-pointer disabled:opacity-50"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Target Department *</label>
                              <input
                                type="text"
                                value={referralForm.department}
                                onChange={e => setReferralForm({ ...referralForm, department: e.target.value })}
                                required
                                disabled={isFetching}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50 font-medium"
                                placeholder="e.g. Cardiology"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Urgency Level *</label>
                              <select
                                value={referralForm.urgency}
                                onChange={e => setReferralForm({ ...referralForm, urgency: e.target.value })}
                                disabled={isFetching}
                                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50 font-medium"
                              >
                                <option value="ROUTINE">ROUTINE</option>
                                <option value="URGENT">URGENT</option>
                                <option value="EMERGENCY">EMERGENCY</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Reason for Transfer *</label>
                            <input
                              type="text"
                              value={referralForm.reason}
                              onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })}
                              required
                              disabled={isFetching}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                              placeholder="Clinical rationale for transfer..."
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Detailed Clinical Notes & Medical History</label>
                            <textarea
                              rows={2}
                              value={referralForm.clinicalNotes}
                              onChange={e => setReferralForm({ ...referralForm, clinicalNotes: e.target.value })}
                              disabled={isFetching}
                              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50 text-xs"
                              placeholder="Key vitals, lab findings, current medications..."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setShowReferralModal(false)}
                        disabled={isFetching}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isFetching}
                        className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isFetching ? 'Fetching Data...' : 'Dispatch Request & Mail Patient'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Provide Specialist Consultation Advice Modal */}
            {showAdviceModal && selectedReferralForAdvice && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-xs shadow-2xl">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-teal-400 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-teal-400" /> Provide Specialist Advice & Opinion
                    </h3>
                    <button onClick={() => setShowAdviceModal(false)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-white font-bold">Patient: {selectedReferralForAdvice.patientId?.name || 'Patient'}</div>
                    <div className="text-slate-400">Requested by: Dr. {selectedReferralForAdvice.referringDoctorId?.fullName || 'Colleague'}</div>
                    <div className="text-cyan-300">Reason: "{selectedReferralForAdvice.reason}"</div>
                  </div>

                  <form onSubmit={handleSubmitAdvice} className="space-y-3.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Clinical Advice & Specialist Opinion *</label>
                      <textarea
                        rows={3}
                        value={adviceForm.adviceNotes}
                        onChange={e => setAdviceForm({ ...adviceForm, adviceNotes: e.target.value })}
                        required
                        placeholder="Provide detailed clinical assessment and recommendations..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Recommended Diagnosis</label>
                      <input
                        type="text"
                        value={adviceForm.recommendedDiagnosis}
                        onChange={e => setAdviceForm({ ...adviceForm, recommendedDiagnosis: e.target.value })}
                        placeholder="e.g. Acute Coronary Syndrome - Anterior Infarct"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Recommended Treatment Protocol / Medications</label>
                      <textarea
                        rows={2}
                        value={adviceForm.recommendedTreatment}
                        onChange={e => setAdviceForm({ ...adviceForm, recommendedTreatment: e.target.value })}
                        placeholder="e.g. Dual antiplatelet therapy, urgent coronary angiography..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdviceModal(false)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Submit Opinion & Notify Patient
                      </button>
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
        {/* Doctor Teleconsultation & Referral History Modal */}
        {showDoctorHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <History className="w-6 h-6 text-teal-400" />
                    <span>Doctor Clinical History & Archives</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Archived clinical referrals and virtual doctor sessions confirmed and completed.</p>
                </div>
                <button
                  onClick={() => setShowDoctorHistoryModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDoctorHistoryTab('APPOINTMENTS')}
                    className={`pb-3 font-bold border-b-2 transition flex items-center gap-2 ${doctorHistoryTab === 'APPOINTMENTS' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <CheckCircle className="w-4 h-4" /> OPD Consultations ({appointments.filter(a => a.status === 'COMPLETED').length})
                  </button>
                  <button
                    onClick={() => setDoctorHistoryTab('REFERRALS')}
                    className={`pb-3 font-bold border-b-2 transition flex items-center gap-2 ${doctorHistoryTab === 'REFERRALS' ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <FileText className="w-4 h-4" /> Completed Referrals ({referrals.filter(r => r.status === 'COMPLETED').length})
                  </button>
                  <button
                    onClick={() => setDoctorHistoryTab('TELECONSULTATIONS')}
                    className={`pb-3 font-bold border-b-2 transition flex items-center gap-2 ${doctorHistoryTab === 'TELECONSULTATIONS' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    <Video className="w-4 h-4" /> Teleconsultations ({teleSessions.filter(s => s.status === 'CLOSED' || s.status === 'COMPLETED').length})
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="mb-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print History Log
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {doctorHistoryTab === 'APPOINTMENTS' ? (
                  appointments.filter(a => a.status === 'COMPLETED').length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
                      <p className="font-bold text-slate-300">No completed OPD consultations in your history yet.</p>
                      <p className="text-slate-500">When you complete an appointment, it will be automatically archived here with diagnosis & prescription notes.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Token & Patient</th>
                            <th className="p-3.5">Department</th>
                            <th className="p-3.5">Date & Time Slot</th>
                            <th className="p-3.5">Diagnosis & Notes</th>
                            <th className="p-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {appointments.filter(a => a.status === 'COMPLETED').map((apt) => (
                            <tr key={apt._id} className="hover:bg-slate-900/50 transition">
                              <td className="p-3.5 font-bold text-white">
                                <span className="inline-block px-2 py-0.5 mr-2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
                                  Token #{apt.tokenNumber || 1}
                                </span>
                                {apt.patientName || apt.patientId?.name || 'Patient'}
                              </td>
                              <td className="p-3.5 font-semibold text-cyan-300">
                                {apt.department || 'General Medicine'}
                              </td>
                              <td className="p-3.5 text-slate-300">
                                {apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'Today'} • {apt.timeSlot || '09:30 AM'}
                              </td>
                              <td className="p-3.5 text-slate-300 max-w-xs space-y-0.5">
                                {apt.prescription?.diagnosis && (
                                  <div className="font-bold text-amber-300 text-[11px]">Dx: {apt.prescription.diagnosis}</div>
                                )}
                                <div className="text-slate-400 truncate text-[11px]">{apt.notes || apt.symptoms || 'Consultation completed'}</div>
                              </td>
                              <td className="p-3.5">
                                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ COMPLETED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : doctorHistoryTab === 'REFERRALS' ? (
                  referrals.filter(r => r.status === 'COMPLETED').length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
                      <p className="font-bold text-slate-300">No completed clinical referrals in history yet.</p>
                      <p className="text-slate-500">When you confirm a referral as completed, it will be automatically archived here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {referrals.filter(r => r.status === 'COMPLETED').map((r) => (
                        <div key={r._id} className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 shadow-lg">
                          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                                🆔 Referral ID: {r.referralId || `REF-${r._id?.toString()?.slice(-6)?.toUpperCase() || r._id}`}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> REFERRAL COMPLETED
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {r.completedAt && (
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {new Date(r.completedAt).toLocaleString()}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteReferral(r._id)}
                                title="Delete Referral Record"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient & Department</span>
                              <p className="font-bold text-white text-sm">{r.patientId?.name || 'Patient'}</p>
                              <p className="text-cyan-400 font-medium text-[11px]">Department: {r.department}</p>
                            </div>

                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Attending Hospital & Doctor</span>
                              <p className="font-bold text-slate-200">{r.receivingFacilityId?.name || 'Care Facility'}</p>
                              <p className="text-purple-300 font-medium text-[11px]">Specialist: Dr. {r.targetDoctorId?.fullName || r.referringDoctorId?.fullName || 'Attending Doctor'}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                            <div>Clinical Reason: <i>"{r.reason}"</i></div>
                            {r.completionNotes && (
                              <div className="text-emerald-400 pt-1 font-semibold border-t border-slate-800 mt-1">
                                Doctor Completion Sign-off: "{r.completionNotes}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  teleSessions.filter(s => s.status === 'CLOSED' || s.status === 'COMPLETED').length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      No completed teleconsultation session history found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Session & Patient</th>
                            <th className="p-3.5">Room & Call Type</th>
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {teleSessions.filter(s => s.status === 'CLOSED' || s.status === 'COMPLETED').map((s) => (
                            <tr key={s._id} className="hover:bg-slate-900/50 transition">
                              <td className="p-3.5 font-bold text-white">
                                {s.patientName || 'Patient'}
                                <span className="block text-[10px] text-slate-500 font-normal">{s.chiefComplaint || 'Consultation'}</span>
                              </td>
                              <td className="p-3.5 text-cyan-300 font-mono">
                                {s.roomName || 'ROOM-01'} ({s.consultationType || 'VIDEO'})
                              </td>
                              <td className="p-3.5 text-slate-400">
                                {new Date(s.updatedAt || s.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3.5">
                                <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ CLOSED
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={(e) => handleDeleteDoctorSession(s._id, e)}
                                  className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition shadow-sm"
                                  title="Delete & Clear Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <span>Total History Records: {appointments.filter(a => a.status === 'COMPLETED').length + referrals.filter(r => r.status === 'COMPLETED').length + teleSessions.filter(s => s.status === 'CLOSED' || s.status === 'COMPLETED').length}</span>
                <button
                  onClick={() => setShowDoctorHistoryModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- FULL MEDITRACK EHR DOSSIER MODAL ----------------- */}
        {showFullEhrModal && selectedPatientHealth && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {selectedPatientHealth.patient?.profilePictureUrl || selectedPatientHealth.mediTrackUser?.profilePictureUrl ? (
                    <img
                      src={selectedPatientHealth.patient?.profilePictureUrl || selectedPatientHealth.mediTrackUser?.profilePictureUrl}
                      alt={selectedPatientHealth.patient?.name || 'Patient'}
                      className="w-12 h-12 rounded-2xl object-cover border border-cyan-500/40 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Heart className="w-6 h-6 animate-pulse" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-3">
                      MediTrack Patient Health Dossier
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        ABDM Verified
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">Comprehensive Personal Health Database & Clinical History</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFullEhrModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vitals Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">PATIENT NAME</div>
                  <div className="text-base font-extrabold text-white mt-1">{selectedPatientHealth.patient?.name}</div>
                  <div className="text-[11px] text-cyan-400 mt-0.5">{selectedPatientHealth.patient?.age}Y • {selectedPatientHealth.patient?.gender}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">ABHA NUMBER</div>
                  <div className="text-base font-extrabold text-cyan-300 mt-1">{selectedPatientHealth.mediTrackUser?.abhaNumber || '91-8812-9904'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{selectedPatientHealth.mediTrackUser?.abhaAddress || 'arka@abdm'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">HEALTH SCORE & STATE</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                    {selectedPatientHealth.mediTrackUser?.healthScore || 92}/100
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedPatientHealth.mediTrackUser?.healthState || 'GREEN'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">BLOOD GROUP & BMI</div>
                  <div className="text-base font-extrabold text-rose-400 mt-1">{selectedPatientHealth.patient?.bloodGroup || 'O+'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">BMI: {selectedPatientHealth.mediTrackUser?.bmi || 23.5}</div>
                </div>
              </div>

              {/* Grid: Meds & Reports */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Active Meds */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Pill className="w-4 h-4 text-cyan-400" /> Active Prescribed Medications ({selectedPatientHealth.activeMedications?.length})
                  </h4>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                    {selectedPatientHealth.activeMedications?.map((m, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="font-extrabold text-white text-xs flex items-center justify-between">
                          <span>{m.name} ({m.dosage})</span>
                          <span className="text-emerald-400 font-semibold">{m.quantity} Qty Left</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Generic: {m.genericName} • Category: {m.category}</div>
                        {m.aiInsights?.recommendation && (
                          <div className="text-[10px] text-amber-300 mt-1">💡 {m.aiInsights.recommendation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous Lab Reports */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Diagnostic Reports & AI Findings ({selectedPatientHealth.previousReports?.length})
                  </h4>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                    {selectedPatientHealth.previousReports?.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white text-xs">{r.folderName}</div>
                          <span className="text-[10px] text-cyan-400 font-semibold">{new Date(r.reportDate).toLocaleDateString()}</span>
                        </div>
                        {r.aiAnalysis?.summary && (
                          <p className="text-[11px] text-slate-300">{r.aiAnalysis.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Genetic Predispositions & Inborn Diseases */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Dna className="w-4 h-4 text-amber-400" /> Genetic Risk Markers & Inborn Condition Analysis
                </h4>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  {selectedPatientHealth.geneticAndInbornIssues?.map((g, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-amber-300">{g.condition}</div>
                      <div className="text-[11px] text-slate-300">{g.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowFullEhrModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition"
                >
                  Close Health Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- REPORT DOCUMENT VIEWER MODAL ----------------- */}
        {selectedReportModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedReportModal.folderName}</h3>
                  <p className="text-xs text-slate-400">Domain: {selectedReportModal.domain} • Uploaded: {new Date(selectedReportModal.reportDate).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => setSelectedReportModal(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedReportModal.files?.length > 0 && (
                <div className="rounded-2xl bg-slate-950 p-2 border border-slate-800 flex justify-center">
                  <img
                    src={selectedReportModal.files[0].url}
                    alt={selectedReportModal.folderName}
                    className="max-h-80 object-contain rounded-xl"
                  />
                </div>
              )}

              {selectedReportModal.aiAnalysis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-cyan-400">AI Diagnostic Report Summary</div>
                  <p className="text-slate-300 leading-relaxed">{selectedReportModal.aiAnalysis.summary}</p>

                  {selectedReportModal.aiAnalysis.keyFindings?.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <div className="font-semibold text-slate-400 text-[11px]">Key Findings:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {selectedReportModal.aiAnalysis.keyFindings.map((kf, idx) => (
                          <li key={idx}>{kf}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

