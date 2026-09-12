import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, Building2, User, Ticket, ChevronRight, AlertCircle, RefreshCw, MapPin, Bed, PhoneCall, ShieldAlert, AlertTriangle, Trash2, History, Printer, X } from 'lucide-react';
import { locationService } from '../../services/locationService';
import useRealtimeSync from '../../hooks/useRealtimeSync';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CITIES_LIST = [
  { city: 'Jalpaiguri', region: 'West Bengal', lat: 26.5400, lng: 88.7100 },
  { city: 'Delhi', region: 'NCR', lat: 28.6139, lng: 77.2090 },
  { city: 'Pune', region: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', region: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Mumbai', region: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Chennai', region: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Amritsar', region: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { city: 'Bengaluru', region: 'Karnataka', lat: 12.9716, lng: 77.5946 }
];

const OPD_DEPARTMENTS = [
  'General OPD',
  'Cardiology OPD',
  'Pediatrics OPD',
  'Orthopedics OPD',
  'Neurology OPD',
  'Dermatology OPD',
  'ENT OPD'
];

const BED_DEPARTMENTS = [
  'Emergency Trauma',
  'ICU / CCU Unit',
  'General Medicine Ward',
  'Maternity & Obstetrics',
  'Pediatrics',
  'Orthopedic Surgery Ward'
];

const BED_TYPES = [
  { id: 'GENERAL_WARD', name: 'General Medicine Ward Bed', desc: 'Standard inpatient care & recovery bed' },
  { id: 'ICU_CCU', name: 'ICU / CCU Ventilator Bed', desc: 'Critical care, cardiac & intensive monitoring' },
  { id: 'OXYGEN_BED', name: 'High-Flow Oxygen Bed', desc: 'Respiratory support & oxygen therapy' },
  { id: 'EMERGENCY_OBSERVATION', name: 'Emergency Trauma Observation', desc: 'Short-stay acute emergency evaluation' },
  { id: 'PEDIATRIC_WARD', name: 'Pediatric Ward Bed', desc: 'Children & neonatal inpatient care' }
];

const AppointmentsPage = () => {
  const location = useLocation();
  const [activeFormMode, setActiveFormMode] = useState('OPD'); // 'OPD' or 'BED_ADMISSION'

  // OPD State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedCity, setSelectedCity] = useState('Jalpaiguri');
  const [userLocation, setUserLocation] = useState({ latitude: 26.5400, longitude: 88.7100, city: 'Jalpaiguri' });
  const [department, setDepartment] = useState('General OPD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:30 AM');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bed Booking & Admission State
  const [bedDepartment, setBedDepartment] = useState('Emergency Trauma');
  const [requestedBedType, setRequestedBedType] = useState('GENERAL_WARD');
  const [admissionReason, setAdmissionReason] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [bedBookings, setBedBookings] = useState([]);
  const [isSubmittingBed, setIsSubmittingBed] = useState(false);
  const [bedSuccessMsg, setBedSuccessMsg] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState('ALL'); // 'ALL', 'OPD', 'BED'

  const [activeQueue, setActiveQueue] = useState({
    userToken: 0,
    currentToken: 0,
    positionInLine: 0,
    estimatedWaitMinutes: 0,
    facilityName: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchBedBookings();
    detectLocationAndFetchFacilities();
  }, []);

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

  // Real-Time Event Sync Hook
  useRealtimeSync({
    channels: [
      'global',
      currentUserId ? `patient:${currentUserId}` : null,
      currentUserId ? `user:${currentUserId}` : null,
      selectedFacilityId ? `facility:${selectedFacilityId}` : null,
    ].filter(Boolean),
    onEvent: (eventPayload) => {
      console.log('⚡ Realtime Update received in AppointmentsPage:', eventPayload);
      fetchAppointments();
      fetchBedBookings();
      if (selectedFacilityId) {
        fetchQueueStatus(selectedFacilityId, department);
      }
    },
    onReconnectRefetch: () => {
      fetchAppointments();
      fetchBedBookings();
      if (selectedFacilityId) {
        fetchQueueStatus(selectedFacilityId, department);
      }
    }
  });

  useEffect(() => {
    fetchFacilitiesForCity(selectedCity, userLocation.latitude, userLocation.longitude);
  }, [selectedCity]);

  const detectLocationAndFetchFacilities = async () => {
    const cachedLoc = locationService.getCachedLocation();
    let loc = cachedLoc || locationService.getDefaultLocation();
    setUserLocation(loc);

    const initialCity = location.state?.city || loc.city || 'Jalpaiguri';
    const matchedCityObj = CITIES_LIST.find(c => c.city.toLowerCase() === initialCity.toLowerCase());
    const validCity = matchedCityObj ? matchedCityObj.city : 'Jalpaiguri';
    setSelectedCity(validCity);

    // Serve cached facilities instantly if available
    const cachedFacs = locationService.getCachedFacilities('appointments');
    if (cachedFacs && cachedFacs.length > 0) {
      setFacilities(cachedFacs);
      if (!selectedFacilityId) {
        setSelectedFacilityId(cachedFacs[0].facilityId || cachedFacs[0]._id);
      }
      setLoading(false);
    }

    try {
      const userPos = await locationService.getCurrentLocation();
      if (userPos && userPos.city) {
        loc = userPos;
        locationService.saveCachedLocation(userPos);
        setUserLocation(userPos);
      }
    } catch (err) {
      console.warn('Geolocation detection warning, using default:', err);
    }

    fetchFacilitiesForCity(validCity, loc.latitude, loc.longitude);
  };

  // Helper to ensure target facility from location.state or URL params is selected & present in dropdown list
  const applyTargetFacilitySelection = async (facList) => {
    const searchParams = new URLSearchParams(location.search);
    const targetId = location.state?.facilityId || searchParams.get('facilityId');
    const targetName = location.state?.facilityName || searchParams.get('facilityName');

    if (!targetId && !targetName) {
      if (facList && facList.length > 0) {
        setSelectedFacilityId(prev => prev || facList[0].facilityId || facList[0]._id);
      }
      return facList;
    }

    let updatedList = Array.isArray(facList) ? [...facList] : [];
    let match = updatedList.find(f => 
      (targetId && (f.facilityId === targetId || String(f._id) === String(targetId) || f._id === targetId)) ||
      (targetName && f.name && f.name.toLowerCase() === targetName.toLowerCase())
    );

    if (!match && targetId) {
      try {
        const res = await axios.get(`${API_BASE}/care-network/facilities/${targetId}`);
        if (res.data && res.data.facility) {
          const targetFac = res.data.facility;
          updatedList = [targetFac, ...updatedList];
          match = targetFac;
        }
      } catch (err) {
        console.warn('Could not fetch target facility for pre-selection:', err);
      }
    }

    if (!match && targetName) {
      const fallbackFac = {
        facilityId: targetId || `FAC-SEL-${Date.now()}`,
        _id: targetId || `FAC-SEL-${Date.now()}`,
        name: targetName,
        facilityType: 'HOSPITAL',
        district: selectedCity
      };
      updatedList = [fallbackFac, ...updatedList];
      match = fallbackFac;
    }

    setFacilities(updatedList);
    if (match) {
      const selectedId = match.facilityId || match._id;
      setSelectedFacilityId(selectedId);
    } else if (updatedList.length > 0) {
      setSelectedFacilityId(updatedList[0].facilityId || updatedList[0]._id);
    }
    return updatedList;
  };

  const fetchFacilitiesForCity = async (cityName, lat, lng) => {
    const cachedFacs = locationService.getCachedFacilities('appointments');
    const cachedLoc = locationService.getCachedLocation();

    const cityObj = CITIES_LIST.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    const queryLat = lat || cityObj?.lat || 26.5400;
    const queryLng = lng || cityObj?.lng || 88.7100;

    const locChanged = locationService.hasLocationChanged({ latitude: queryLat, longitude: queryLng, city: cityName }, cachedLoc, 0.5);

    if (!locChanged && cachedFacs && cachedFacs.length > 0) {
      console.log('⚡ AppointmentsPage serving cached facilities (location delta < 0.5km).');
      setFacilities(cachedFacs);
      await applyTargetFacilitySelection(cachedFacs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/care-network/facilities?city=${encodeURIComponent(cityName)}&lat=${queryLat}&lng=${queryLng}`
      );

      let fetchedFacs = (res.data && res.data.facilities) ? res.data.facilities : [];

      if (!fetchedFacs || fetchedFacs.length === 0) {
        try {
          const fallbackRes = await axios.get(`${API_BASE}/care-network/facilities`);
          if (fallbackRes.data && Array.isArray(fallbackRes.data.facilities)) {
            fetchedFacs = fallbackRes.data.facilities;
          }
        } catch (eFallback) {
          console.warn('Fallback facility fetch failed:', eFallback.message);
        }
      }

      if (fetchedFacs.length > 0) {
        locationService.saveCachedFacilities(fetchedFacs, { latitude: queryLat, longitude: queryLng, city: cityName }, 'appointments');
        await applyTargetFacilitySelection(fetchedFacs);
      } else {
        setFacilities([]);
        setSelectedFacilityId('');
      }
    } catch (err) {
      console.error('Error fetching facilities for city:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (newCity) => {
    setSelectedCity(newCity);
    const cityObj = CITIES_LIST.find(c => c.city === newCity);
    if (cityObj) {
      setUserLocation({ latitude: cityObj.lat, longitude: cityObj.lng, city: newCity });
    }
  };

  useEffect(() => {
    if (selectedFacilityId) {
      fetchQueueStatus(selectedFacilityId, department);
    }
  }, [selectedFacilityId, department, appointments]);

  useEffect(() => {
    if (!selectedFacilityId) return;
    const interval = setInterval(() => {
      fetchQueueStatus(selectedFacilityId, department);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedFacilityId, department, appointments]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/appointments/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.appointments) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBedBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/care-network/bed-bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.bookings) {
        setBedBookings(res.data.bookings);
      }
    } catch (err) {
      console.warn('Error fetching bed bookings:', err.message);
    }
  };

  const fetchQueueStatus = async (facId, dept = department) => {
    if (!facId) return;
    const facObj = facilities.find(f => (f.facilityId === facId || f._id === facId));
    const userAptForFac = appointments.find(
      a => (a.facilityId === facId || a.facilityName === facObj?.name) &&
           a.department === dept &&
           a.status !== 'COMPLETED' &&
           a.status !== 'CANCELLED'
    );
    const userTokenNum = userAptForFac ? userAptForFac.tokenNumber : null;

    try {
      const res = await axios.get(
        `${API_BASE}/care-network/queue/${facId}?department=${encodeURIComponent(dept)}&tokenNumber=${userTokenNum !== null && userTokenNum !== undefined ? userTokenNum : ''}`
      );
      if (res.data && res.data.success) {
        setActiveQueue({
          userToken: userAptForFac ? (res.data.userToken || userAptForFac.tokenNumber || 0) : 0,
          currentToken: res.data.currentToken || 0,
          positionInLine: userAptForFac ? (res.data.positionInLine || 0) : 0,
          estimatedWaitMinutes: userAptForFac ? (res.data.estimatedWaitMinutes || 0) : 0,
          facilityName: facObj?.name || 'Selected Healthcare Facility',
          hasAppointment: !!userAptForFac,
          department: res.data.department || dept,
          departmentQueues: res.data.departmentQueues || {},
          averageConsultationMinutes: res.data.averageConsultationMinutes || 7,
          currentPatientRemainingMinutes: res.data.currentPatientRemainingMinutes || 7
        });
      }
    } catch (err) {
      console.warn('Queue status error:', err.message);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const facilityObj = facilities.find(f => (f.facilityId === selectedFacilityId || f._id === selectedFacilityId));
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(`${API_BASE}/care-network/appointments`, {
        facilityId: selectedFacilityId || 'FAC-DEFAULT',
        facilityName: facilityObj ? facilityObj.name : 'Healthcare Center',
        department,
        appointmentDate: date,
        timeSlot: time,
        type: 'IN_PERSON'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingSuccess(`Token #${res.data.tokenNumber} requested at ${facilityObj ? facilityObj.name : 'Hospital'} for ${date} at ${time}. Awaiting hospital permission before confirmation.`);
      fetchAppointments();
      if (selectedFacilityId) fetchQueueStatus(selectedFacilityId, department);
      setTimeout(() => setBookingSuccess(null), 6000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookBed = async (e) => {
    e.preventDefault();
    if (isSubmittingBed) return;
    setIsSubmittingBed(true);
    const facilityObj = facilities.find(f => (f.facilityId === selectedFacilityId || f._id === selectedFacilityId)) || facilities[0];
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(`${API_BASE}/care-network/bed-bookings`, {
        facilityId: selectedFacilityId || facilityObj?.facilityId || 'FAC-DEFAULT',
        facilityName: facilityObj?.name || 'Public Healthcare Center',
        department: bedDepartment,
        requestedBedType: requestedBedType,
        patientAge: patientAge,
        patientGender: patientGender,
        contactPhone: contactPhone,
        reasonForAdmission: admissionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setBedSuccessMsg(res.data.message);
        fetchBedBookings();
        setAdmissionReason('');
        setContactPhone('');
        setTimeout(() => setBedSuccessMsg(''), 6000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit bed booking request');
    } finally {
      setIsSubmittingBed(false);
    }
  };

  const handleCancelBedBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel / delete this bed admission request?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/care-network/bed-bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBedBookings();
    } catch (err) {
      alert('Failed to cancel bed booking request.');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;
    try {
      const token = localStorage.getItem('token');
      const cleanId = String(id).startsWith('CARE-') ? String(id).replace('CARE-', '') : id;
      await axios.delete(`${API_BASE}/care-network/appointments/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
    } catch (err) {
      alert('Failed to delete appointment record.');
    }
  };

  const handleMarkCompleteAppointment = async (id) => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const cleanId = String(id).startsWith('CARE-') ? String(id).replace('CARE-', '') : id;
      await axios.patch(`${API_BASE}/care-network/appointments/${cleanId}/status`, { status: 'COMPLETED' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update appointment status.');
    }
  };

  const handleSimulateQueueStep = async () => {
    if (!selectedFacilityId) return;
    try {
      await axios.post(`${API_BASE}/care-network/queue/${selectedFacilityId}/next?department=${encodeURIComponent(department)}`);
      fetchQueueStatus(selectedFacilityId, department);
    } catch (err) {
      console.error('Failed to advance queue:', err);
    }
  };

  const selectedFacilityObj = facilities.find(f => (f.facilityId === selectedFacilityId || f._id === selectedFacilityId));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* REAL-TIME QUEUE STATUS BANNER */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-teal-50/90 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl border border-blue-200/80 dark:border-blue-800/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 dark:border-blue-800/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300/60 dark:border-transparent text-xs font-bold uppercase">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Real-Time Public Facility Queue Status • {selectedFacilityObj?.name || activeQueue.facilityName || 'Select Facility'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 dark:text-white">LIVE OPD TOKEN QUEUE ({department.toUpperCase()})</h1>
          </div>

        </div>

        {/* OPD SECTION SELECTOR PILLS */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-blue-800 dark:text-blue-300 tracking-wider">Switch OPD Department Queue:</span>
          <div className="flex flex-wrap gap-2">
            {OPD_DEPARTMENTS.map(dept => {
              const isActive = department === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setDepartment(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md scale-105'
                      : 'bg-white/80 hover:bg-blue-100 text-blue-950 border border-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800/40'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-blue-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-blue-900 dark:text-blue-200">YOUR TOKEN</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{activeQueue.userToken ? `#${activeQueue.userToken}` : '--'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-blue-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-blue-900 dark:text-blue-200">NOW SERVING</span>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">#{activeQueue.currentToken || 1}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-blue-200/80 dark:border-white/10 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-blue-900 dark:text-blue-200">PEOPLE AHEAD</span>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-300">{activeQueue.positionInLine}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-blue-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
            <span className="text-[10px] font-extrabold uppercase text-blue-900 dark:text-blue-200">ESTIMATED WAIT</span>
            <p className="text-3xl font-black text-cyan-700 dark:text-cyan-300">
              {activeQueue.userToken === 0 ? '0 Mins' : activeQueue.positionInLine === 0 ? "0 / You're next" : `~${activeQueue.estimatedWaitMinutes} Mins`}
            </p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Based on live queue status</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: TABBED BOOKING FORM (OPD APPOINTMENT vs BED ADMISSION) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
          
          {/* TAB SWITCHER */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveFormMode('OPD')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                activeFormMode === 'OPD'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book OPD Slot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormMode('BED_ADMISSION')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                activeFormMode === 'BED_ADMISSION'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bed className="w-4 h-4" />
              <span>Bed & Admission</span>
            </button>
          </div>

          {/* FORM 1: BOOK OPD APPOINTMENT SLOT */}
          {activeFormMode === 'OPD' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Book OPD Appointment Slot</span>
              </h2>

              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300">
                  ✓ {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Your Active Location / City:</span>
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">📍 {selectedCity} (GPS active)</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full p-3 bg-blue-50/60 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CITIES_LIST.map(c => (
                      <option key={c.city} value={c.city}>
                        {c.city}, {c.region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Select Public Healthcare Facility in {selectedCity}:</span>
                    {loading && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading Facilities...</span>
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    disabled={loading || !Array.isArray(facilities) || facilities.length === 0}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <option value="">⏳ Fetching public healthcare facilities in {selectedCity}...</option>
                    ) : !Array.isArray(facilities) || facilities.length === 0 ? (
                      <option value="">No healthcare facilities found in {selectedCity}</option>
                    ) : (
                      facilities.map(f => {
                        const fId = f.facilityId || f._id;
                        return (
                          <option key={fId} value={fId}>
                            {f.name} ({f.facilityType ? f.facilityType.replace('_', ' ') : 'Hospital'})
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">OPD Department Section:</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none"
                  >
                    {OPD_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date:</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Time:</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  {isSubmitting ? 'Booking Appointment...' : 'Confirm Appointment & Issue Token'}
                </button>
              </form>
            </div>
          )}

          {/* FORM 2: REQUEST EMERGENCY BED BOOKING & ADMISSION */}
          {activeFormMode === 'BED_ADMISSION' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bed className="w-5 h-5 text-emerald-600" />
                <span>Request Hospital Bed & Admission</span>
              </h2>

              {bedSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-300 space-y-1">
                  <div>✓ {bedSuccessMsg}</div>
                  <p className="text-[11px] font-normal">
                    If beds are available, hospital desk will allocate a specific bed number. If full, request remains in pending waitlist.
                  </p>
                </div>
              )}

              <form onSubmit={handleBookBed} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active City Location:</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">📍 {selectedCity}</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full p-3 bg-emerald-50/60 dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {CITIES_LIST.map(c => (
                      <option key={c.city} value={c.city}>
                        {c.city}, {c.region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Select Target Public Hospital in {selectedCity}:</span>
                    {loading && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading Hospitals...</span>
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                    disabled={loading || !Array.isArray(facilities) || facilities.length === 0}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <option value="">⏳ Fetching public hospitals in {selectedCity}...</option>
                    ) : !Array.isArray(facilities) || facilities.length === 0 ? (
                      <option value="">No healthcare facilities found in {selectedCity}</option>
                    ) : (
                      facilities.map(f => {
                        const fId = f.facilityId || f._id;
                        const openBeds = f.bedCount ? f.bedCount.available : 8;
                        return (
                          <option key={fId} value={fId}>
                            {f.name} — ({openBeds > 0 ? `${openBeds} Beds Open` : 'FULL / WAITLIST ONLY'})
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Admission Department:</label>
                    <select
                      value={bedDepartment}
                      onChange={(e) => setBedDepartment(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                    >
                      {BED_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Bed Category:</label>
                    <select
                      value={requestedBedType}
                      onChange={(e) => setRequestedBedType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      {BED_TYPES.map(bt => (
                        <option key={bt.id} value={bt.id}>{bt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Patient Contact Phone:</label>
                    <input
                      type="text"
                      placeholder="Emergency Mobile Phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Patient Age / Gender:</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Age (e.g. 34)"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-1/2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-1/2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Admission / Symptoms:</label>
                  <textarea
                    rows={2}
                    placeholder="Describe emergency symptoms, acute trauma or clinical reason for inpatient bed request..."
                    value={admissionReason}
                    onChange={(e) => setAdmissionReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBed}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Bed className="w-4 h-4" />
                  <span>{isSubmittingBed ? 'Submitting Request...' : 'Submit Emergency Bed & Admission Request'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MY APPOINTMENTS & MY BED BOOKINGS */}
        <div className="lg:col-span-7 space-y-6">
          {(() => {
            const activeAppointments = appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
            const activeBedBookings = bedBookings.filter(b => b.status !== 'DISCHARGED' && b.status !== 'CANCELLED');

            return (
              <>
                {/* SECTION 1: MY BED ADMISSION REQUESTS */}
                {activeBedBookings.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-emerald-600" />
                        <span>My Active Bed Admission Passes ({activeBedBookings.length})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setHistoryTab('BED'); setShowHistoryModal(true); }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50 transition shadow-sm"
                          title="View Discharged Bed Passes History"
                        >
                          <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>History ({bedBookings.filter(b => b.status === 'DISCHARGED' || b.status === 'CANCELLED').length})</span>
                        </button>
                        <button
                          onClick={fetchBedBookings}
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      </div>
                    </h2>

                    <div className="space-y-3">
                      {activeBedBookings.map((b, bIdx) => {
                        const isApproved = b.status === 'APPROVED_BED_ALLOTTED' || b.status === 'ADMITTED';
                        const isShifted = b.status === 'SHIFTED_TO_GENERAL_WARD';
                        const isDischarged = b.status === 'DISCHARGED';
                        const isWaitlisted = b.status === 'WAITLISTED';

                        return (
                          <div
                            key={b._id || bIdx}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3 transition hover:border-emerald-500/50"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase">
                                    PASS #{b.admissionPassNumber}
                                  </span>
                                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                    isDischarged
                                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                      : isShifted
                                      ? 'bg-purple-600 text-white'
                                      : isApproved
                                      ? 'bg-emerald-500 text-white animate-pulse'
                                      : isWaitlisted
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                  }`}>
                                    {isDischarged
                                      ? '🏁 DISCHARGED FROM HOSPITAL (BED FREED)'
                                      : isShifted
                                      ? `🛏️ SHIFTED TO GENERAL WARD: #${b.allottedBedNumber}`
                                      : isApproved
                                      ? `🟢 BED ALLOTTED: #${b.allottedBedNumber}`
                                      : isWaitlisted
                                      ? '🟡 WAITLISTED (BEDS FULL)'
                                      : '⏳ PENDING HOSPITAL ALLOCATION'}
                                  </span>
                                </div>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white">{b.facilityName}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  Department: <strong className="text-emerald-600 dark:text-emerald-400">{b.department}</strong> • Requested Category: <strong className="text-slate-800 dark:text-white">{(b.requestedBedType || 'GENERAL_WARD').replace('_', ' ')}</strong>
                                </p>
                              </div>

                              <button
                                onClick={() => handleCancelBedBooking(b._id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                                title={isDischarged ? "Delete Discharged Pass Record" : "Cancel / Delete Bed Request"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Allotted / Shifted / Discharged Bed Details Box */}
                            {isDischarged ? (
                              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs space-y-1">
                                <div className="flex items-center justify-between font-black text-slate-800 dark:text-slate-200">
                                  <span>Status: Hospital Inpatient Discharge Completed</span>
                                  <span className="text-xs bg-slate-600 text-white px-2.5 py-0.5 rounded-lg">Discharged</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                  {b.dischargeNotes || 'Patient officially discharged in stable condition. Bed tag released.'}
                                </p>
                              </div>
                            ) : isShifted ? (
                              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs space-y-1">
                                <div className="flex items-center justify-between font-black text-purple-900 dark:text-purple-300">
                                  <span>Bed Location: General Medicine Ward</span>
                                  <span className="text-sm bg-purple-600 text-white px-2.5 py-0.5 rounded-lg">Bed #{b.allottedBedNumber}</span>
                                </div>
                                <p className="text-[11px] text-purple-800 dark:text-purple-300 font-medium">
                                  {b.hospitalNotes || 'Patient transferred to General Medicine Ward for continued recovery.'}
                                </p>
                              </div>
                            ) : isApproved ? (
                              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1">
                                <div className="flex items-center justify-between font-black text-emerald-800 dark:text-emerald-300">
                                  <span>Bed Allotted: {b.allottedBedType ? b.allottedBedType.replace('_', ' ') : 'General Bed'}</span>
                                  <span className="text-sm bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg">Bed #{b.allottedBedNumber}</span>
                                </div>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                  {b.hospitalNotes || 'Hospital admission Desk confirmed bed allocation. Please present Admission Pass at emergency reception.'}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                <span className="font-bold block text-slate-800 dark:text-slate-200">Hospital Desk Note:</span>
                                <p className="text-[11px] italic">{b.hospitalNotes || 'Request submitted to facility desk. Bed number will be allotted upon availability verification.'}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION 2: MY OPD APPOINTMENTS LIST */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-indigo-600" />
                      <span>My OPD Healthcare Appointments ({activeAppointments.length})</span>
                    </span>
                    <button
                      onClick={() => { setHistoryTab('OPD'); setShowHistoryModal(true); }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50 transition shadow-sm"
                      title="View Completed OPD Appointments History"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>History ({appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').length})</span>
                    </button>
                  </h2>

                  {activeAppointments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 text-xs space-y-2">
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {appointments.some(a => a.status === 'COMPLETED' || a.status === 'CANCELLED')
                          ? 'No active upcoming OPD appointments. Your completed appointments have been moved to History.'
                          : 'No active appointments booked yet. Select a facility on the left to book your OPD slot.'}
                      </p>
                      {appointments.some(a => a.status === 'COMPLETED' || a.status === 'CANCELLED') && (
                        <button
                          type="button"
                          onClick={() => { setHistoryTab('OPD'); setShowHistoryModal(true); }}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow hover:bg-indigo-700 transition"
                        >
                          View Completed Appointments History
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAppointments.map(apt => {
                        const isDelayed = apt.isDelayed || apt.status === 'RESCHEDULED';
                  return (
                    <div
                      key={apt.appointmentId || apt._id}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 transition hover:border-blue-400 dark:hover:border-blue-500"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase">
                              Token #{apt.tokenNumber}
                            </span>
                            {isDelayed && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Rescheduled by Hospital
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">{apt.facilityName}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Department: <span className="text-blue-600 dark:text-blue-400 font-bold">{apt.department}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkCompleteAppointment(apt.appointmentId || apt._id)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50 transition shadow-xs"
                            title="Mark appointment as completed & move to History"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Done</span>
                          </button>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1 ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            apt.status === 'CONFIRMED' ? 'bg-blue-600 text-white shadow-sm border border-blue-400 font-black' :
                            apt.status === 'CHECKED_IN' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' :
                            apt.status === 'IN_CONSULTATION' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                            apt.status === 'RESCHEDULED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}>
                            {apt.status === 'PENDING_APPROVAL' || apt.status === 'REQUESTED' || apt.status === 'BOOKED'
                              ? '⏳ Awaiting Hospital Permission'
                              : apt.status === 'CONFIRMED'
                              ? 'CONFIRMED'
                              : apt.status}
                          </span>
                          <button
                            onClick={() => handleDeleteAppointment(apt.appointmentId || apt._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete Appointment Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Assigned Doctor Banner */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Allocated Doctor</span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {apt.doctorName && apt.doctorName !== 'Duty Medical Officer' ? apt.doctorName : (apt.doctorName || 'Duty Medical Officer')}
                            </span>
                            {apt.doctorSpecialization && (
                              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold ml-2">
                                • {apt.doctorSpecialization}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-slate-600 dark:text-slate-300 font-semibold">
                          <span className="text-[10px] text-slate-400 block font-normal">Appointment Slot</span>
                          <span>{apt.date} at {apt.time}</span>
                        </div>
                      </div>

                      {/* Delay / Reschedule Note Banner */}
                      {isDelayed && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4" /> Hospital Schedule Update / Delay Notice
                          </div>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300">
                            {apt.delayReason || apt.notes ? `Note from Hospital: "${apt.delayReason || apt.notes}"` : 'Your appointment slot has been updated by the hospital.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      );
    })()}
  </div>
</div>

      {/* ----------------- PATIENT CLINICAL & PASS HISTORY MODAL ----------------- */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Patient Clinical Care & Pass History Archive
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Archived OPD Consultations & Discharged Inpatient Passes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Print Clinical History"
                >
                  <Printer className="w-3.5 h-3.5" /> Print History
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={() => setHistoryTab('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  historyTab === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Archive ({appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').length + bedBookings.filter(b => b.status === 'DISCHARGED').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('OPD')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  historyTab === 'OPD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Completed OPD ({appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('BED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  historyTab === 'BED' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Discharged Bed Passes ({bedBookings.filter(b => b.status === 'DISCHARGED').length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* OPD History Items */}
              {(historyTab === 'ALL' || historyTab === 'OPD') && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed / Archived OPD Consultations</h4>
                  {appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                      No completed OPD consultations logged in history yet.
                    </div>
                  ) : (
                    appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED').map(apt => (
                      <div key={apt.appointmentId || apt._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{apt.facilityName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Department: {apt.department} • Token #{apt.tokenNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>
                              {apt.status}
                            </span>
                            <button
                              onClick={() => handleDeleteAppointment(apt.appointmentId || apt._id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete History Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span>Doctor: <strong>{apt.doctorName || 'Duty Specialist'}</strong> ({apt.doctorSpecialization || 'Specialist'})</span>
                          <span>Date: {apt.date} at {apt.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Bed Passes History Items */}
              {(historyTab === 'ALL' || historyTab === 'BED') && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discharged Inpatient Bed Passes</h4>
                  {bedBookings.filter(b => b.status === 'DISCHARGED').length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                      No discharged bed passes logged in history yet.
                    </div>
                  ) : (
                    bedBookings.filter(b => b.status === 'DISCHARGED').map(b => (
                      <div key={b._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{b.facilityName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Pass #{b.admissionPassNumber} • Dept: {b.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                              DISCHARGED
                            </span>
                            <button
                              onClick={() => handleCancelBedBooking(b._id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Discharged Pass Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{b.dischargeNotes || 'Patient officially discharged in stable condition. Bed tag released.'}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
