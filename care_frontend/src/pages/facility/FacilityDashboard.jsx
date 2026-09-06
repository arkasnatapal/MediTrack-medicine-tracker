import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiveKitCallModal from '../../components/calling/LiveKitCallModal';
import {
  Building2, Calendar, Users, ArrowUpRight, ArrowDownLeft, Stethoscope,
  Activity, Package, Bed, ShieldAlert, LogOut, CheckCircle, Clock, Plus, RefreshCw, Send, AlertTriangle, Layers, Edit3, Save, X, Video, UserCheck, Trash2, UserPlus, History, Printer
} from 'lucide-react';


export default function FacilityDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalSubTab, setHistoryModalSubTab] = useState('appointments');

  // Data States
  const [appointments, setAppointments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [registeredDoctors, setRegisteredDoctors] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [teleSessions, setTeleSessions] = useState([]);
  const [bedBookings, setBedBookings] = useState([]);

  // Bed Admission Approval Modal States
  const [showApproveBedModal, setShowApproveBedModal] = useState(false);
  const [targetBedBooking, setTargetBedBooking] = useState(null);
  const [allottedBedType, setAllottedBedType] = useState('ICU Bed');
  const [allottedBedNumber, setAllottedBedNumber] = useState('');
  const [hospitalNotes, setHospitalNotes] = useState('');

  // Shift Ward Modal States
  const [showShiftWardModal, setShowShiftWardModal] = useState(false);
  const [shiftTargetBooking, setShiftTargetBooking] = useState(null);
  const [shiftBedNumber, setShiftBedNumber] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');


  // Emergency Transfer Response Modal States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferActionStatus, setTransferActionStatus] = useState('ACCEPTED');
  const [transferEta, setTransferEta] = useState(25);
  const [transferRejectionReason, setTransferRejectionReason] = useState('');

  const handleUpdateTransferStatus = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    try {
      await api.put(`/transfers/${selectedTransfer._id}/status`, {
        status: transferActionStatus,
        etaMinutes: transferEta,
        rejectionReason: transferRejectionReason,
      });
      alert(`✓ Emergency Patient Transfer status updated to ${transferActionStatus}!`);
      setShowTransferModal(false);
      setSelectedTransfer(null);
      loadFacilityData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transfer status.');
    }
  };

  const handleUpdateReferralStatus = async (referralId, newStatus) => {
    try {
      await api.put(`/referrals/${referralId}/status`, { status: newStatus });
      alert(`✓ Referral status updated to ${newStatus}!`);
      loadFacilityData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update referral status.');
    }
  };

  const handleDeleteReferral = async (referralId) => {
    if (!window.confirm('Are you sure you want to delete this hospital referral record? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/referrals/${referralId}`);
      setReferrals(prev => prev.filter(r => r._id !== referralId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete referral record.');
    }
  };

  // LiveKit Call Modal States
  const [showLiveKitModal, setShowLiveKitModal] = useState(false);
  const [liveKitRoomName, setLiveKitRoomName] = useState('');
  const [liveKitCallType, setLiveKitCallType] = useState('VIDEO');



  const todayDateStr = new Date().toISOString().split('T')[0];
  const [allocationDate, setAllocationDate] = useState(todayDateStr);
  const [allocationTime, setAllocationTime] = useState('16:00');

  const formatDateTimeString = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes] = timeStr.split(':');
      const dateObj = new Date(year, month - 1, day, hours, minutes);
      const dateFormatted = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted} at ${timeFormatted}`;
    } catch (e) {
      return `${dateStr} ${timeStr}`;
    }
  };

  const handleDateChange = (newDate) => {
    setAllocationDate(newDate);
    const formatted = formatDateTimeString(newDate, allocationTime);
    setAllocationForm(prev => ({ ...prev, scheduledTime: formatted }));
  };

  const handleTimeChange = (newTime) => {
    setAllocationTime(newTime);
    const formatted = formatDateTimeString(allocationDate, newTime);
    setAllocationForm(prev => ({ ...prev, scheduledTime: formatted }));
  };

  // Teleconsultation Doctor Allocation State
  const [allocationForm, setAllocationForm] = useState({
    sessionId: '',
    doctorId: '',
    scheduledTime: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at 04:00 PM`,
  });

  // Doctor Association Form State (Select from Registered Doctors Only)
  const [doctorAssociationForm, setDoctorAssociationForm] = useState({
    doctorId: '',
    department: 'General OPD',
    designation: 'Senior Consultant Specialist',
    employmentType: 'FULL_TIME',
  });

  // Capacity Editing States
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityForm, setCapacityForm] = useState({
    emergencyBeds: { total: 10, occupied: 2 },
    icuBeds: { total: 0, occupied: 0 },
    oxygenBeds: { total: 5, occupied: 2 },
    generalBeds: { total: 30, occupied: 15 },
    ventilatorsAvailable: 0,
  });

  // OPD Appointment Doctor Assignment & Delay Modal States
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [targetAppointment, setTargetAppointment] = useState(null);
  const [aptDoctorId, setAptDoctorId] = useState('');
  const [delayDate, setDelayDate] = useState('');
  const [delayTime, setDelayTime] = useState('10:00 AM');
  const [delayReason, setDelayReason] = useState('');

  const openAssignDoctorModal = (apt) => {
    setTargetAppointment(apt);
    setAptDoctorId(apt.doctorId?._id || apt.doctorId || (registeredDoctors[0]?._id || ''));
    setShowAssignDoctorModal(true);
  };

  const openDelayModal = (apt) => {
    setTargetAppointment(apt);
    const dateStr = apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setDelayDate(dateStr);
    setDelayTime(apt.timeSlot || '10:00 AM');
    setDelayReason(apt.notes || 'Hospital schedule adjustment');
    setShowDelayModal(true);
  };

  const handleAssignDoctorToAppointment = async (e) => {
    e.preventDefault();
    if (!targetAppointment || !aptDoctorId) {
      return alert('Please select a doctor to assign');
    }
    try {
      await api.put(`/appointments/${targetAppointment._id}/assign-doctor`, {
        doctorId: aptDoctorId
      });
      alert('Doctor assigned successfully! Email notification and in-app alert dispatched to patient.');
      setShowAssignDoctorModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign doctor');
    }
  };

  const handleDelayAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!targetAppointment || !delayDate || !delayTime) {
      return alert('Please select date and time for delay / reschedule');
    }
    try {
      await api.put(`/appointments/${targetAppointment._id}/delay`, {
        appointmentDate: delayDate,
        timeSlot: delayTime,
        delayReason,
        status: 'RESCHEDULED'
      });
      alert('Appointment delayed/rescheduled! Email notice and in-app alert dispatched to patient.');
      setShowDelayModal(false);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delay appointment');
    }
  };

  const openApproveBedModal = (booking) => {
    setTargetBedBooking(booking);
    const category = booking.requestedBedType || 'GENERAL_WARD';
    setAllottedBedType(category);
    const bedPrefix = category === 'ICU' ? 'ICU-BED' : category === 'OXYGEN_BED' ? 'OXY-BED' : category === 'PEDIATRIC_WARD' ? 'PED-BED' : 'GEN-BED';
    setAllottedBedNumber(`${bedPrefix}-${Math.floor(10 + Math.random() * 90)}`);
    setHospitalNotes('Bed allocated & reserved by hospital admission desk.');
    setShowApproveBedModal(true);
  };

  const handleApproveBedSubmit = async (e) => {
    e.preventDefault();
    if (!targetBedBooking) return;
    try {
      setLoading(true);
      await api.put(`/appointments/bed-bookings/${targetBedBooking._id}/approve`, {
        allottedBedType,
        allottedBedNumber,
        hospitalNotes
      });
      alert(`🎉 Bed #${allottedBedNumber} approved & allotted! Total available bed count occupied by 1.`);
      setShowApproveBedModal(false);
      setTargetBedBooking(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to approve bed admission: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openShiftWardModal = (booking) => {
    setShiftTargetBooking(booking);
    setShiftBedNumber(`GEN-WARD-${Math.floor(10 + Math.random() * 90)}`);
    setShiftNotes('Patient transferred to General Ward for continued recovery.');
    setShowShiftWardModal(true);
  };

  const handleShiftWardSubmit = async (e) => {
    e.preventDefault();
    if (!shiftTargetBooking) return;
    try {
      setLoading(true);
      await api.put(`/appointments/bed-bookings/${shiftTargetBooking._id}/shift-ward`, {
        newBedNumber: shiftBedNumber,
        hospitalNotes: shiftNotes
      });
      alert(`🛏️ Patient shifted to General Ward Bed #${shiftBedNumber}! Email and in-app notifications dispatched.`);
      setShowShiftWardModal(false);
      setShiftTargetBooking(null);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to shift patient to general ward: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchPatient = async (booking) => {
    if (!window.confirm(`Are you sure you want to DISCHARGE patient ${booking.patientName || ''} (Pass #${booking.admissionPassNumber})?\n\nThis will release 1 occupied bed back to available inventory and send official discharge email & in-app notification.`)) {
      return;
    }
    try {
      setLoading(true);
      await api.put(`/appointments/bed-bookings/${booking._id}/dispatch`, {
        summaryNotes: 'Patient officially discharged from inpatient care in stable condition.'
      });
      alert(`🏥 Patient ${booking.patientName || ''} discharged successfully! Bed released (+1 available count). Moved to Discharged History.`);
      await loadDashboardData();
    } catch (err) {
      alert('Failed to discharge patient: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBedBookingRecord = async (bookingId) => {
    if (!window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this discharged bed admission record?\n\nThis action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/appointments/bed-bookings/${bookingId}`);
      alert('🗑️ Bed admission record permanently deleted!');
      await loadDashboardData();
    } catch (err) {
      alert('Failed to delete bed admission record: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointmentRecord = async (aptId) => {
    if (!window.confirm('⚠️ Are you sure you want to PERMANENTLY delete this completed appointment record?\n\nThis action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/appointments/${aptId}`);
      alert('🗑️ Appointment record permanently deleted!');
      await loadDashboardData();
    } catch (err) {
      alert('Failed to delete appointment record: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };



  // Transfer Request Form
  const [transferForm, setTransferForm] = useState({
    patientId: '',
    destinationFacilityId: '',
    reason: '',
    clinicalSummary: '',
    requiredDepartment: 'Emergency Trauma',
    requiredBedType: 'EMERGENCY',
    urgency: 'CRITICAL',
    ambulanceRequired: true,
  });

  // Inventory Form
  const [inventoryForm, setInventoryForm] = useState({
    medicineName: '',
    genericName: '',
    strength: '500mg',
    dosageForm: 'Tablet',
    quantity: 500,
    minimumThreshold: 50,
    batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
    expiryDate: '2027-12-31',
  });

  const facilityId = user?.facility?._id || user?.facilityId?._id || user?.facilityId;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (facilityId) {
        const [appRes, refRes, transRes, invRes, capRes, teleRes, regDocRes, assocRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/referrals'),
          api.get('/transfers'),
          api.get('/inventory'),
          api.get(`/facilities/${facilityId}`),
          api.get('/teleconsultations', { params: { facilityId } }),
          api.get('/doctors'),
          api.get('/facility-doctors'),
        ]);
        setAppointments(appRes.data);
        setReferrals(refRes.data);
        setTransfers(transRes.data);
        setInventory(invRes.data);
        setCapacity(capRes.data.capacity);
        setDoctors(capRes.data.doctors || []);
        setTeleSessions(teleRes.data || []);
        setRegisteredDoctors(regDocRes.data || []);
        setAssociations(assocRes.data || []);

        try {
          const bbRes = await api.get('/appointments/bed-bookings/all');
          if (bbRes.data && bbRes.data.bookings) {
            setBedBookings(bbRes.data.bookings);
          }
        } catch (bbErr) {
          console.warn('Could not fetch bed bookings:', bbErr);
        }

        if (regDocRes.data && regDocRes.data.length > 0 && !doctorAssociationForm.doctorId) {
          setDoctorAssociationForm(prev => ({ ...prev, doctorId: regDocRes.data[0]._id }));
        }

        if (capRes.data.doctors && capRes.data.doctors.length > 0) {
          setAllocationForm(prev => ({ ...prev, doctorId: capRes.data.doctors[0]._id }));
        }

        if (capRes.data.capacity) {
          const cap = capRes.data.capacity;
          setCapacityForm({
            emergencyBeds: {
              total: cap.emergencyBeds?.total ?? 10,
              occupied: cap.emergencyBeds?.occupied ?? 2,
            },
            icuBeds: {
              total: cap.icuBeds?.total ?? 0,
              occupied: cap.icuBeds?.occupied ?? 0,
            },
            oxygenBeds: {
              total: cap.oxygenBeds?.total ?? 5,
              occupied: cap.oxygenBeds?.occupied ?? 2,
            },
            generalBeds: {
              total: cap.generalBeds?.total ?? 30,
              occupied: cap.generalBeds?.occupied ?? 15,
            },
            ventilatorsAvailable: cap.ventilatorsAvailable ?? 0,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load facility data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [facilityId]);

  // Associate Registered Doctor to Facility
  const handleAssociateDoctor = async (e) => {
    e.preventDefault();
    if (!doctorAssociationForm.doctorId) {
      return alert('Please select a registered doctor');
    }
    try {
      await api.post('/facility-doctors/request', {
        doctorId: doctorAssociationForm.doctorId,
        facilityId,
        department: doctorAssociationForm.department,
        designation: doctorAssociationForm.designation,
        employmentType: doctorAssociationForm.employmentType,
      });
      alert('Registered doctor associated successfully with this facility!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Association failed');
    }
  };

  // Disassociate Doctor
  const handleDisassociateDoctor = async (assocId) => {
    if (!window.confirm('Are you sure you want to disassociate this doctor from the facility?')) return;
    try {
      await api.put(`/facility-doctors/${assocId}/status`, { status: 'ENDED' });
      alert('Doctor status updated to ENDED.');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  // Assign Doctor to Teleconsultation Request
  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!allocationForm.sessionId || !allocationForm.doctorId) {
      return alert('Please select a pending teleconsultation session and a doctor');
    }
    try {
      const docObj = registeredDoctors.find(d => d._id === allocationForm.doctorId) || doctors.find(d => d._id === allocationForm.doctorId);
      await api.put(`/teleconsultations/${allocationForm.sessionId}/assign`, {
        doctorId: allocationForm.doctorId,
        doctorName: docObj?.fullName || 'Specialist Officer',
        scheduledTime: allocationForm.scheduledTime,
      });
      alert('Doctor assigned & confirmation email trigger dispatched to patient with join link!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  // Save Bed Capacity
  const handleSaveCapacity = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/facilities/${facilityId}/capacity`, capacityForm);
      setCapacity(res.data);
      setIsEditingCapacity(false);
      alert('Bed Capacity updated successfully!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update capacity');
    }
  };

  // Handle Transfer Creation
  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transfers', {
        ...transferForm,
        originatingFacilityId: facilityId,
      });
      alert('Emergency Transfer Request Submitted!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer failed');
    }
  };

  // Handle Inventory Add
  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', inventoryForm);
      alert('Medicine Stock Item Added Successfully!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Add stock failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col md:flex-row relative overflow-hidden selection:bg-teal-500 selection:text-slate-950 font-sans">
      {/* Grainy Texture Overlay */}
      <div className="grainy-overlay" />

      {/* Floating Ambient Mesh Orbs */}
      <div className="ambient-orb-teal -top-20 -left-20 animate-float-slow" />
      <div className="ambient-orb-cyan bottom-10 right-10 animate-float-reverse" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 liquid-glass border-r border-white/10 p-6 flex flex-col justify-between shrink-0 relative z-20 backdrop-blur-2xl">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold text-white truncate max-w-[140px]">{user?.facility?.name || 'Care Facility'}</h2>
              <span className={`text-[10px] font-tech px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {user?.verificationStatus || 'PENDING'}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-tech font-semibold">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'doctors', label: 'Doctors & Staff', icon: Stethoscope },
              { id: 'teleconsultations', label: 'Teleconsult Allocations', icon: Video },
              { id: 'appointments', label: 'OPD Appointments', icon: Calendar },
              { id: 'bed-admissions', label: 'Bed Admissions', icon: Bed },
              { id: 'transfers', label: 'Emergency Transfers', icon: ArrowUpRight },
              { id: 'referrals', label: 'Referrals', icon: Layers },
              { id: 'inventory', label: 'Medicine Inventory', icon: Package },
              { id: 'capacity', label: 'Bed Capacity', icon: Bed },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === item.id ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center space-x-2 text-xs font-semibold text-rose-400 hover:text-rose-300">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab} Dashboard</h1>
            <p className="text-xs text-slate-400">MediTrack Care Network Provider Portal • Facility ID: {facilityId || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'bed-admissions') {
                  setHistoryModalSubTab('beds');
                } else {
                  setHistoryModalSubTab('appointments');
                }
                setShowHistoryModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center gap-1.5 border border-teal-500/30 shadow-sm transition"
              title="Open Hospital History Archive Modal"
            >
              <History className="w-3.5 h-3.5 text-teal-400" />
              <span>History</span>
              <span className="px-1.5 py-0.2 bg-teal-400/20 text-teal-300 text-[10px] rounded-full font-extrabold">
                {appointments.filter(a => a.status === 'COMPLETED').length + bedBookings.filter(b => b.status === 'DISCHARGED').length}
              </span>
            </button>
            <button onClick={loadDashboardData} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Associated Doctors</span>
                <div className="text-2xl font-extrabold text-teal-400 mt-1">{associations.length || doctors.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Pending Teleconsults</span>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">{teleSessions.filter(s => s.status === 'PENDING').length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Today Appointments</span>
                <div className="text-2xl font-extrabold text-white mt-1">{appointments.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">ICU Beds Available</span>
                <div className="text-2xl font-extrabold text-cyan-400 mt-1">{capacity?.icuBeds?.available ?? 0} / {capacity?.icuBeds?.total ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Doctors & Staff Management Console (Add Doctors from Registered System Doctors Only) */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 text-xs">
            {/* Registered Doctor Selection Form */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" /> Associate Doctor with Hospital (Registered Doctors Only)
              </h3>
              <p className="text-slate-400">Select a verified doctor registered in the MediTrack Care Network database and assign them to your hospital roster.</p>

              <form onSubmit={handleAssociateDoctor} className="grid md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Select Registered Doctor *</label>
                  <select
                    value={doctorAssociationForm.doctorId}
                    onChange={e => setDoctorAssociationForm({ ...doctorAssociationForm, doctorId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold"
                  >
                    <option value="">-- Choose Registered Doctor --</option>
                    {registeredDoctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.fullName.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}`} ({d.specialization} • MCI: {d.medicalRegistrationNumber || 'Verified'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assigned Department *</label>
                  <select
                    value={doctorAssociationForm.department}
                    onChange={e => setDoctorAssociationForm({ ...doctorAssociationForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold"
                  >
                    <option value="General OPD">General OPD</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Emergency Trauma">Emergency Trauma</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="ICU">ICU & Critical Care</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Gynecology">Gynecology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={doctorAssociationForm.employmentType}
                    onChange={e => setDoctorAssociationForm({ ...doctorAssociationForm, employmentType: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold"
                  >
                    <option value="FULL_TIME">Full-Time Staff</option>
                    <option value="PART_TIME">Part-Time Consultant</option>
                    <option value="VISITING">Visiting Specialist</option>
                    <option value="TELE_CONSULTANT">Teleconsultant Officer</option>
                  </select>
                </div>

                <div className="md:col-span-4 pt-2">
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20">
                    <UserPlus className="w-4 h-4" /> Add Doctor to Hospital Roster
                  </button>
                </div>
              </form>
            </div>

            {/* Hospital Associated Doctors Roster Table */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Facility Active Doctor Roster</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Doctor Name</th>
                      <th className="py-2.5 px-3">Specialization & Qualification</th>
                      <th className="py-2.5 px-3">Department & Designation</th>
                      <th className="py-2.5 px-3">Employment Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {associations.length === 0 && doctors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">No doctors associated yet. Select a registered doctor above to add.</td>
                      </tr>
                    ) : (
                      associations.map(a => (
                        <tr key={a._id} className="hover:bg-slate-950/40">
                          <td className="py-3 px-3 font-semibold text-white">
                            {a.doctorId?.fullName ? (a.doctorId.fullName.startsWith('Dr.') ? a.doctorId.fullName : `Dr. ${a.doctorId.fullName}`) : 'Doctor'}
                            <span className="block text-[10px] text-slate-500">MCI Reg: {a.doctorId?.medicalRegistrationNumber || 'Verified'}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="font-bold text-teal-400">{a.doctorId?.specialization || 'Specialist'}</span>
                            <span className="block text-[10px] text-slate-400">{a.doctorId?.qualification || 'MBBS'}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {a.department}
                            <span className="block text-[10px] text-slate-400">{a.designation}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-semibold">{a.employmentType}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${a.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 flex items-center gap-2">
                            {a.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => {
                                    const docId = a.doctorId?._id || a.doctorId;
                                    const facId = user?.facilityId || 'FACILITY';
                                    setLiveKitRoomName(`hospital_${facId}_doctor_${docId}`);
                                    setLiveKitCallType('VIDEO');
                                    setShowLiveKitModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 font-bold text-[10px] flex items-center gap-1"
                                >
                                  <Video className="w-3 h-3" /> CALL DOCTOR
                                </button>
                                <button onClick={() => handleDisassociateDoctor(a._id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold text-[10px]">
                                  DISASSOCIATE
                                </button>
                              </>
                            )}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Teleconsultation Allocations Tab for Hospital Staff */}
        {activeTab === 'teleconsultations' && (
          <div className="space-y-6 text-xs">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" /> Hospital Teleconsultation Doctor Allocation Console
              </h3>
              <p className="text-slate-400">Review patient requests in PENDING status, assign an available doctor, set the consultation time, and send the email meeting link.</p>

              <form onSubmit={handleAssignDoctor} className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Select Patient Session (Allocate / Reallocate) *</label>
                  <select
                    value={allocationForm.sessionId}
                    onChange={e => setAllocationForm({ ...allocationForm, sessionId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold"
                  >
                    <option value="">-- Choose Request to Allocate / Reallocate --</option>
                    {teleSessions.map(s => (
                      <option key={s._id} value={s._id}>
                        [{s.status}] {s.patientName} ({s.specialty} • Current Doc: {s.doctorName || 'None'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assign / Reallocate Doctor *</label>
                  <select
                    value={allocationForm.doctorId}
                    onChange={e => setAllocationForm({ ...allocationForm, doctorId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold"
                  >
                    <option value="">-- Select Doctor --</option>
                    {registeredDoctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.fullName.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}`} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-teal-400" /> Scheduled Date & Time *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Calendar Date Picker */}
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-teal-400 absolute left-3 pointer-events-none z-10" />
                      <input
                        type="date"
                        value={allocationDate}
                        onChange={e => handleDateChange(e.target.value)}
                        required
                        className="w-full pl-9 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                      />
                    </div>

                    {/* Clock Time Picker */}
                    <div className="relative flex items-center">
                      <Clock className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none z-10" />
                      <input
                        type="time"
                        value={allocationTime}
                        onChange={e => handleTimeChange(e.target.value)}
                        required
                        className="w-full pl-9 pr-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-teal-400 font-extrabold pt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Formatted: {allocationForm.scheduledTime || 'Select Date & Time'}</span>
                  </div>
                </div>

                <div className="md:col-span-3 pt-2">
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20">
                    <Send className="w-4 h-4" /> Save Doctor Allocation & Dispatch Email Join Link
                  </button>
                </div>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">All Facility Teleconsultation Sessions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Specialty / Problem</th>
                      <th className="py-2.5 px-3">Assigned Doctor</th>
                      <th className="py-2.5 px-3">Scheduled Time</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {teleSessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">No teleconsultation sessions found.</td>
                      </tr>
                    ) : (
                      teleSessions.map(s => (
                        <tr key={s._id} className="hover:bg-slate-950/40">
                          <td className="py-3 px-3 font-semibold text-white">
                            {s.patientName}
                            <span className="block text-[10px] text-slate-500">{s.patientEmail || s.patientPhone}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <span className="font-bold text-teal-400">{s.specialty}</span>
                            <span className="block text-[10px] text-slate-400">{s.symptoms}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-200">
                            {s.doctorName ? (s.doctorName.startsWith('Dr.') ? s.doctorName : `Dr. ${s.doctorName}`) : 'Unassigned'}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{s.scheduledTime || 'N/A'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${s.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'ACTIVE' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : s.status === 'TERMINATED' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                setAllocationForm({
                                  sessionId: s._id,
                                  doctorId: s.assignedDoctorId || (registeredDoctors[0]?._id || ''),
                                  scheduledTime: s.scheduledTime || `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, 04:30 PM`,
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 font-bold text-[10px] flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Reallocate Doctor
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bed Capacity Tab */}
        {activeTab === 'capacity' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Real-Time Bed & Emergency Capacity Monitor</h3>
                <p className="text-xs text-slate-400">Manage live bed availability and emergency resources for your facility.</p>
              </div>

              {!isEditingCapacity ? (
                <button
                  onClick={() => setIsEditingCapacity(true)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                >
                  <Edit3 className="w-4 h-4" /> Edit Capacity Numbers
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingCapacity(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel Editing
                </button>
              )}
            </div>

            {!isEditingCapacity ? (
              <div className="grid md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-300 mb-2">Emergency Beds</div>
                  <div className="text-2xl font-extrabold text-teal-400">
                    {Math.max(0, (capacityForm.emergencyBeds.total - capacityForm.emergencyBeds.occupied))} Available
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    {capacityForm.emergencyBeds.occupied} Occupied / {capacityForm.emergencyBeds.total} Total
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-300 mb-2">ICU Beds</div>
                  <div className="text-2xl font-extrabold text-cyan-400">
                    {Math.max(0, (capacityForm.icuBeds.total - capacityForm.icuBeds.occupied))} Available
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    {capacityForm.icuBeds.occupied} Occupied / {capacityForm.icuBeds.total} Total
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-300 mb-2">Oxygen Supported Beds</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {Math.max(0, (capacityForm.oxygenBeds.total - capacityForm.oxygenBeds.occupied))} Available
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    {capacityForm.oxygenBeds.occupied} Occupied / {capacityForm.oxygenBeds.total} Total
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-slate-300 mb-2">General Ward Beds</div>
                  <div className="text-2xl font-extrabold text-indigo-400">
                    {Math.max(0, (capacityForm.generalBeds.total - capacityForm.generalBeds.occupied))} Available
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">
                    {capacityForm.generalBeds.occupied} Occupied / {capacityForm.generalBeds.total} Total
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveCapacity} className="space-y-6 text-xs bg-slate-950 p-6 rounded-xl border border-slate-800">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <div className="font-bold text-teal-400 text-sm">Emergency Beds</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Total Emergency Beds</label>
                        <input
                          type="number"
                          min="0"
                          value={capacityForm.emergencyBeds.total}
                          onChange={e => setCapacityForm({
                            ...capacityForm,
                            emergencyBeds: { ...capacityForm.emergencyBeds, total: Math.max(0, parseInt(e.target.value) || 0) }
                          })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Occupied Emergency Beds</label>
                        <input
                          type="number"
                          min="0"
                          value={capacityForm.emergencyBeds.occupied}
                          onChange={e => setCapacityForm({
                            ...capacityForm,
                            emergencyBeds: { ...capacityForm.emergencyBeds, occupied: Math.max(0, parseInt(e.target.value) || 0) }
                          })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                    <div className="font-bold text-cyan-400 text-sm">ICU Beds</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Total ICU Beds</label>
                        <input
                          type="number"
                          min="0"
                          value={capacityForm.icuBeds.total}
                          onChange={e => setCapacityForm({
                            ...capacityForm,
                            icuBeds: { ...capacityForm.icuBeds, total: Math.max(0, parseInt(e.target.value) || 0) }
                          })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Occupied ICU Beds</label>
                        <input
                          type="number"
                          min="0"
                          value={capacityForm.icuBeds.occupied}
                          onChange={e => setCapacityForm({
                            ...capacityForm,
                            icuBeds: { ...capacityForm.icuBeds, occupied: Math.max(0, parseInt(e.target.value) || 0) }
                          })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCapacity(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Save className="w-4 h-4" /> Save Capacity Numbers
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* OPD Appointments Console Tab */}
        {activeTab === 'appointments' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  <span>Facility Active OPD Appointments Console</span>
                </h3>
                <p className="text-xs text-slate-400">Active and upcoming patient OPD appointments for this healthcare facility.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setHistoryModalSubTab('appointments');
                    setShowHistoryModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 flex items-center gap-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> View History Modal ({appointments.filter(a => a.status === 'COMPLETED').length})
                </button>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 font-extrabold text-xs rounded-full border border-teal-500/30">
                  Active: {appointments.filter(a => a.status !== 'COMPLETED').length}
                </span>
              </div>
            </div>

            {appointments.filter(a => a.status !== 'COMPLETED').length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No active pending OPD appointments right now. Click the <strong className="text-teal-400">History</strong> button above to view completed consultation records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Token & Patient</th>
                      <th className="p-3">Department & Assigned Doctor</th>
                      <th className="p-3">Slot & Date</th>
                      <th className="p-3">Symptoms / Notes</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Hospital Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {appointments.filter(a => a.status !== 'COMPLETED').map((apt) => {
                      const docName = apt.doctorId?.fullName ? (apt.doctorId.fullName.startsWith('Dr.') ? apt.doctorId.fullName : `Dr. ${apt.doctorId.fullName}`) : (apt.doctorName || null);
                      return (
                        <tr key={apt._id} className="hover:bg-slate-950/50 transition">
                          <td className="p-3 font-bold text-white">
                            <span className="inline-block px-2 py-0.5 mr-2 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[10px]">
                              Token #{apt.tokenNumber || 1}
                            </span>
                            {apt.patientName || apt.patientId?.name || 'Patient'}
                            <span className="block text-[10px] text-slate-500 font-normal">{apt.patientId?.email || apt.patientId?.phone || 'Registered Patient'}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-cyan-300 block">{apt.department || 'General OPD'}</span>
                            <span className={`text-[11px] font-bold ${docName ? 'text-teal-400' : 'text-amber-400/80 italic'}`}>
                              {docName ? `👨‍⚕️ ${docName}` : '⚠️ Doctor Unassigned'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold">{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'Today'}</span> at <span className="text-teal-300 font-bold">{apt.timeSlot || '09:30 AM'}</span>
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs">
                            <span className="truncate block">{apt.symptoms || apt.reasonForVisit || 'General Consultation'}</span>
                            {apt.notes && <span className="text-[10px] text-amber-400 italic block">Note: {apt.notes}</span>}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              apt.status === 'IN_CONSULTATION' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                              apt.status === 'RESCHEDULED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {apt.status || 'CONFIRMED'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openAssignDoctorModal(apt)}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-bold text-[10px] flex items-center gap-1 transition"
                              >
                                <UserPlus className="w-3 h-3" /> Assign Doctor
                              </button>
                              <button
                                onClick={() => openDelayModal(apt)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[10px] flex items-center gap-1 transition"
                              >
                                <Clock className="w-3 h-3" /> Delay / Reschedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bed Admissions & Emergency Requests Console Tab */}
        {activeTab === 'bed-admissions' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bed className="w-5 h-5 text-teal-400" />
                  <span>Hospital Active Bed Admissions & Booking Console</span>
                </h3>
                <p className="text-xs text-slate-400">Current active inpatient bed requests and admitted patients.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setHistoryModalSubTab('beds');
                    setShowHistoryModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 flex items-center gap-1.5 transition"
                >
                  <Clock className="w-4 h-4 text-cyan-400" /> View History Modal ({bedBookings.filter(b => b.status === 'DISCHARGED').length})
                </button>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-extrabold text-xs rounded-full border border-amber-500/30">
                  Pending: {bedBookings.filter(b => (b.status === 'PENDING' || b.status === 'WAITLISTED')).length}
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-500/30">
                  Active Inpatients: {bedBookings.filter(b => b.status !== 'DISCHARGED').length}
                </span>
              </div>
            </div>

            {bedBookings.filter(b => b.status !== 'DISCHARGED').length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No active inpatient bed admission requests right now. Click the <strong className="text-teal-400">History</strong> button above to view discharged patient records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Pass # & Patient</th>
                      <th className="p-3">Requested Bed Mode</th>
                      <th className="p-3">Priority & Department</th>
                      <th className="p-3">Reason / Diagnosis</th>
                      <th className="p-3">Status / Allotted Bed</th>
                      <th className="p-3 text-right">Hospital Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bedBookings.filter(b => b.status !== 'DISCHARGED').map((booking) => (
                      <tr key={booking._id} className="hover:bg-slate-950/50 transition">
                        <td className="p-3 font-bold text-white">
                          <span className="inline-block px-2 py-0.5 mr-2 rounded bg-teal-500/20 text-teal-300 font-extrabold text-[10px]">
                            #{booking.admissionPassNumber || 'PASS-00'}
                          </span>
                          {booking.patientName || 'Patient'}
                          <span className="block text-[10px] text-slate-500 font-normal">{booking.contactPhone || 'Contact N/A'}</span>
                        </td>
                        <td className="p-3 font-semibold text-cyan-300">
                          {booking.requestedBedType ? booking.requestedBedType.replace('_', ' ') : 'General Ward'}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            booking.urgencyLevel === 'URGENT' || booking.urgencyLevel === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {booking.urgencyLevel || 'NORMAL'}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{booking.department || 'Emergency / General'}</span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs">
                          <span className="truncate block">{booking.reasonForAdmission || 'Hospital Admission'}</span>
                          {booking.preferredDate && <span className="text-[10px] text-teal-400 block">Date: {new Date(booking.preferredDate).toLocaleDateString()}</span>}
                        </td>
                        <td className="p-3">
                          {booking.status === 'APPROVED_BED_ALLOTTED' ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                🟢 BED ALLOTTED
                              </span>
                              <span className="block text-[11px] font-extrabold text-teal-300 mt-1">
                                #{booking.allottedBedNumber || 'BED-01'} ({booking.allottedBedType || 'ICU'})
                              </span>
                            </div>
                          ) : booking.status === 'SHIFTED_TO_GENERAL_WARD' ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🛏️ GENERAL WARD SHIFT
                              </span>
                              <span className="block text-[11px] font-extrabold text-purple-300 mt-1">
                                #{booking.allottedBedNumber || 'GEN-WARD-01'}
                              </span>
                            </div>
                          ) : booking.status === 'WAITLISTED' ? (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              ⚠️ WAITLISTED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⏳ PENDING APPROVAL
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {booking.status === 'APPROVED_BED_ALLOTTED' || booking.status === 'SHIFTED_TO_GENERAL_WARD' ? (
                            <div className="flex items-center justify-end gap-2">
                              {booking.status !== 'SHIFTED_TO_GENERAL_WARD' && booking.allottedBedType !== 'GENERAL_WARD' && (
                                <button
                                  onClick={() => openShiftWardModal(booking)}
                                  className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                                  title="Shift patient to General Medicine Ward"
                                >
                                  <Bed className="w-3.5 h-3.5" /> Shift to General Ward
                                </button>
                              )}
                              <button
                                onClick={() => handleDispatchPatient(booking)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                                title="Discharge patient & release occupied bed"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Dispatch Patient
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openApproveBedModal(booking)}
                              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] shadow-md shadow-teal-500/20 transition flex items-center gap-1 ml-auto"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve & Allot Bed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: EMERGENCY TRANSFERS ----------------- */}
        {activeTab === 'transfers' && (
          <div className="space-y-6 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-rose-400" /> Emergency Inter-Hospital Transfers Console
                </h3>
                <p className="text-slate-400 text-xs">Monitor and respond to incoming and outgoing emergency patient transfer requests.</p>
              </div>
            </div>

            <div className="space-y-4">
              {transfers.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <ArrowUpRight className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No emergency patient transfer records found.</p>
                </div>
              ) : (
                transfers.map(t => {
                  const isIncoming = t.destinationFacilityId?._id === user?.facility?._id || t.destinationFacilityId === user?.facility?._id;

                  return (
                    <div key={t._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base font-bold text-white">{t.patientId?.name || 'Patient'}</span>
                            <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] ${isIncoming ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                              {isIncoming ? 'INCOMING TRANSFER' : 'OUTGOING TRANSFER'}
                            </span>
                            {t.isInterState && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-extrabold text-[10px] border border-rose-500/30">
                                ⚠️ INTER-STATE VERIFIED
                              </span>
                            )}
                            {t.patientFamilyConsent?.consentGiven && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                ✓ FAMILY CONSENTED
                              </span>
                            )}
                          </div>

                          <div className="text-slate-400 text-xs flex items-center gap-2">
                            <span>Origin: <strong className="text-slate-200">{t.originatingFacilityId?.name || 'Care Facility'}</strong></span>
                            <span>➔</span>
                            <span>Destination: <strong className="text-cyan-400">{t.destinationFacilityId?.name || 'Hospital'}</strong></span>
                            <span>•</span>
                            <span>Bed Type: <strong className="text-emerald-400">{t.requiredBedType}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${t.urgency === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {t.urgency} URGENCY
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                        <div>Department Required: <strong>{t.requiredDepartment}</strong></div>
                        <div>Reason: <i>"{t.reason}"</i></div>
                        {t.patientFamilyConsent?.consentGiven && (
                          <div className="text-emerald-400 text-[11px]">
                            Family Consent: Authorised by <strong>{t.patientFamilyConsent.familyMemberName}</strong> ({t.patientFamilyConsent.familyRelation}) - {t.patientFamilyConsent.familyContact}
                          </div>
                        )}
                      </div>

                      {/* Action buttons for receiving hospital */}
                      {isIncoming && t.status === 'REQUESTED' && (
                        <div className="pt-2 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setTransferActionStatus('REJECTED');
                              setShowTransferModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30"
                          >
                            Reject Transfer
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransfer(t);
                              setTransferActionStatus('ACCEPTED');
                              setShowTransferModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                          >
                            Accept Transfer & Reserve Bed
                          </button>
                        </div>
                      )}

                      {isIncoming && t.status === 'ACCEPTED' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleUpdateTransferStatus({ preventDefault: () => {} }, 'ADMITTED')}
                            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20"
                          >
                            Mark Patient Arrived & Admitted
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: REFERRALS ----------------- */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" /> Hospital Clinical Referrals Console
                </h3>
                <p className="text-slate-400 text-xs">Manage all incoming and outgoing clinical referrals across the MediTrack network.</p>
              </div>
            </div>

            <div className="space-y-4">
              {referrals.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
                  <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No hospital referral records found.</p>
                </div>
              ) : (
                referrals.map(r => (
                  <div key={r._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0">
                            🆔 Referral ID: {r.referralId || `REF-${r._id?.toString()?.slice(-6)?.toUpperCase() || r._id}`}
                          </span>
                          <span className="text-base font-bold text-white">{r.patientId?.name || 'Patient'}</span>
                        </div>
                        <span className="text-cyan-400 font-semibold text-xs block">Target: {r.receivingFacilityId?.name || 'Specialist Hospital'}</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      <div>Department: <strong>{r.department}</strong></div>
                      <div>Reason: <i>"{r.reason}"</i></div>
                    </div>

                    {r.status === 'SENT' && (
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdateReferralStatus(r._id, 'ACCEPTED')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                        >
                          Accept Referral
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Fallback for remaining tabs */}
        {activeTab === 'inventory' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 capitalize">{activeTab} Console</h3>
            <p className="text-xs text-slate-400">Manage all facility records for {activeTab}.</p>
          </div>
        )}

        {/* Emergency Transfer Status Action Modal */}
        {showTransferModal && selectedTransfer && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" /> Process Patient Emergency Transfer
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-white font-bold">Patient: {selectedTransfer.patientId?.name || 'Patient'}</div>
                <div className="text-slate-400">Required Bed: <strong className="text-emerald-400">{selectedTransfer.requiredBedType}</strong></div>
              </div>

              <form onSubmit={handleUpdateTransferStatus} className="space-y-3.5">
                {transferActionStatus === 'ACCEPTED' ? (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Estimated Arrival Time (ETA in Minutes) *</label>
                    <input
                      type="number"
                      value={transferEta}
                      onChange={e => setTransferEta(Number(e.target.value))}
                      required
                      min={5}
                      max={180}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rejection Reason *</label>
                    <textarea
                      rows={2}
                      value={transferRejectionReason}
                      onChange={e => setTransferRejectionReason(e.target.value)}
                      required
                      placeholder="e.g. ICU beds currently at 100% capacity..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-xl font-bold text-slate-950 ${transferActionStatus === 'ACCEPTED' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'}`}
                  >
                    Confirm {transferActionStatus}
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
            participantName={user?.name || 'Hospital Representative'}
            callType={liveKitCallType}
            onClose={() => setShowLiveKitModal(false)}
            onCallEnded={() => setShowLiveKitModal(false)}
          />
        )}

        {/* Assign Doctor Modal */}
        {showAssignDoctorModal && targetAppointment && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-400" /> Assign Doctor for Patient
                </h3>
                <button onClick={() => setShowAssignDoctorModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-300 font-bold text-sm">
                  Token #{targetAppointment.tokenNumber || 1} • {targetAppointment.patientName || targetAppointment.patientId?.name || 'Patient'}
                </div>
                <div className="text-slate-400 text-xs">
                  Department: <span className="text-cyan-300 font-semibold">{targetAppointment.department || 'General OPD'}</span>
                </div>
              </div>

              <form onSubmit={handleAssignDoctorToAppointment} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Select Doctor to Allocate *</label>
                  <select
                    value={aptDoctorId}
                    onChange={e => setAptDoctorId(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Choose Registered Doctor --</option>
                    {registeredDoctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.fullName?.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}`} ({d.specialization})
                      </option>
                    ))}
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.fullName?.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName}`} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-[11px] text-teal-300">
                  ℹ️ Submitting will automatically send an email confirmation and in-app notification to the patient.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignDoctorModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                  >
                    <Send className="w-4 h-4" /> Confirm & Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delay / Reschedule Appointment Modal */}
        {showDelayModal && targetAppointment && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" /> Delay / Reschedule Appointment
                </h3>
                <button onClick={() => setShowDelayModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-300 font-bold text-sm">
                  Token #{targetAppointment.tokenNumber || 1} • {targetAppointment.patientName || targetAppointment.patientId?.name || 'Patient'}
                </div>
                <div className="text-slate-400 text-xs">
                  Department: <span className="text-cyan-300 font-semibold">{targetAppointment.department || 'General OPD'}</span>
                </div>
              </div>

              <form onSubmit={handleDelayAppointmentSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Date *</label>
                    <input
                      type="date"
                      value={delayDate}
                      onChange={e => setDelayDate(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">New Slot / Time *</label>
                    <select
                      value={delayTime}
                      onChange={e => setDelayTime(e.target.value)}
                      required
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason for Delay / Note to Patient</label>
                  <textarea
                    rows={2}
                    value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                    placeholder="e.g. Emergency surgery delay, Doctor on rounds..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300">
                  ⚠️ This action will notify the patient via Email & In-App alert about the revised timing.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Send className="w-4 h-4" /> Save Schedule & Send Alerts
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approve & Allot Bed Modal */}
        {showApproveBedModal && targetBedBooking && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-teal-400 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-teal-400" /> Allot Bed & Approve Admission
                </h3>
                <button onClick={() => setShowApproveBedModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-300 font-bold text-sm">
                  Pass #{targetBedBooking.admissionPassNumber} • {targetBedBooking.patientName || 'Patient'}
                </div>
                <div className="text-slate-400 text-xs">
                  Requested Bed Mode: <span className="text-teal-300 font-semibold">{targetBedBooking.requestedBedType || 'General Ward'}</span>
                </div>
              </div>

              <form onSubmit={handleApproveBedSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assign Bed Number / Tag *</label>
                  <input
                    type="text"
                    value={allottedBedNumber}
                    onChange={e => setAllottedBedNumber(e.target.value)}
                    required
                    placeholder="e.g. ICU-BED-04, WARD-3-BED-12"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirmed Bed Category *</label>
                  <select
                    value={allottedBedType}
                    onChange={e => setAllottedBedType(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-xs"
                  >
                    <option value="ICU">ICU Bed (Intensive Care)</option>
                    <option value="OXYGEN_BED">Oxygen Bed Support</option>
                    <option value="GENERAL_WARD">General Ward Bed</option>
                    <option value="PEDIATRIC_WARD">Pediatric Ward Bed</option>
                    <option value="EMERGENCY_ISOLATION">Emergency Isolation Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hospital Notes for Patient</label>
                  <textarea
                    rows={2}
                    value={hospitalNotes}
                    onChange={e => setHospitalNotes(e.target.value)}
                    placeholder="e.g. Please report directly to Trauma Center Gate 2..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-[11px] text-teal-300">
                  ⚡ Approving will assign bed number to patient's pass and <strong>occupy 1 available bed</strong> from facility capacity.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveBedModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                  >
                    <CheckCircle className="w-4 h-4" /> Allot Bed (Occupies 1 Bed)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Shift to General Ward Modal */}
        {showShiftWardModal && shiftTargetBooking && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-purple-400 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-purple-400" /> Shift Patient to General Ward
                </h3>
                <button onClick={() => setShowShiftWardModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-300 font-bold text-sm">
                  Pass #{shiftTargetBooking.admissionPassNumber} • {shiftTargetBooking.patientName || 'Patient'}
                </div>
                <div className="text-slate-400 text-xs">
                  Current Bed: <span className="text-cyan-300 font-semibold">#{shiftTargetBooking.allottedBedNumber || 'N/A'} ({shiftTargetBooking.allottedBedType || 'ICU'})</span>
                </div>
              </div>

              <form onSubmit={handleShiftWardSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New General Ward Bed Tag / Number *</label>
                  <input
                    type="text"
                    value={shiftBedNumber}
                    onChange={e => setShiftBedNumber(e.target.value)}
                    required
                    placeholder="e.g. GEN-WARD-14, WARD-B-BED-08"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ward Transfer Notes for Patient</label>
                  <textarea
                    rows={2}
                    value={shiftNotes}
                    onChange={e => setShiftNotes(e.target.value)}
                    placeholder="e.g. Patient condition stabilized, transferred to General Ward Room 204..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-300">
                  ℹ️ Submitting will update the patient's pass to General Ward and send an automated email & in-app notification.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShiftWardModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
                  >
                    <Bed className="w-4 h-4" /> Confirm Ward Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hospital History & Archives Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <History className="w-6 h-6 text-teal-400" />
                    <span>Hospital Completed Records & History Archive</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review completed OPD consultations and discharged inpatient bed records. Delete individual records to permanently free up database storage.
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Sub-Navigation Tabs */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryModalSubTab('appointments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      historyModalSubTab === 'appointments'
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>OPD Completed Appointments ({appointments.filter(a => a.status === 'COMPLETED').length})</span>
                  </button>
                  <button
                    onClick={() => setHistoryModalSubTab('beds')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      historyModalSubTab === 'beds'
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Discharged Bed Admissions ({bedBookings.filter(b => b.status === 'DISCHARGED').length})</span>
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Print Clinical Register</span>
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* SUBTAB 1: OPD COMPLETED APPOINTMENTS HISTORY */}
                {historyModalSubTab === 'appointments' && (
                  <div>
                    {appointments.filter(a => a.status === 'COMPLETED').length === 0 ? (
                      <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                        No completed appointment history records found in system database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Token & Patient</th>
                              <th className="p-3.5">Department & Doctor</th>
                              <th className="p-3.5">Date & Slot</th>
                              <th className="p-3.5">Symptoms / Notes</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {appointments.filter(a => a.status === 'COMPLETED').map((apt) => {
                              const docName = apt.doctorId?.fullName ? (apt.doctorId.fullName.startsWith('Dr.') ? apt.doctorId.fullName : `Dr. ${apt.doctorId.fullName}`) : (apt.doctorName || 'Attending Physician');
                              return (
                                <tr key={apt._id} className="hover:bg-slate-900/50 transition">
                                  <td className="p-3.5 font-bold text-white">
                                    <span className="inline-block px-2 py-0.5 mr-2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
                                      Token #{apt.tokenNumber || 1}
                                    </span>
                                    {apt.patientName || apt.patientId?.name || 'Patient'}
                                  </td>
                                  <td className="p-3.5">
                                    <span className="font-semibold text-cyan-300 block">{apt.department || 'General OPD'}</span>
                                    <span className="text-[11px] font-bold text-teal-400">👨‍⚕️ {docName}</span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="font-semibold">{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : 'Completed'}</span> at <span className="text-teal-300 font-bold">{apt.timeSlot || '09:30 AM'}</span>
                                  </td>
                                  <td className="p-3.5 text-slate-400 max-w-xs">
                                    <span className="truncate block">{apt.symptoms || apt.reasonForVisit || 'General Consultation'}</span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ✓ COMPLETED
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-[10px] text-slate-500 italic mr-1">Buttons Disabled</span>
                                      <button
                                        onClick={() => handleDeleteAppointmentRecord(apt._id)}
                                        className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition shadow-sm"
                                        title="Permanently delete record"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: DISCHARGED BED ADMISSIONS HISTORY */}
                {historyModalSubTab === 'beds' && (
                  <div>
                    {bedBookings.filter(b => b.status === 'DISCHARGED').length === 0 ? (
                      <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                        No discharged bed admission history records found in system database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Pass # & Patient</th>
                              <th className="p-3.5">Last Allotted Bed</th>
                              <th className="p-3.5">Discharge Date & Time</th>
                              <th className="p-3.5">Discharge Summary / Notes</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {bedBookings.filter(b => b.status === 'DISCHARGED').map((booking) => (
                              <tr key={booking._id} className="hover:bg-slate-900/50 transition">
                                <td className="p-3.5 font-bold text-white">
                                  <span className="inline-block px-2 py-0.5 mr-2 rounded bg-slate-800 text-slate-300 font-extrabold text-[10px]">
                                    #{booking.admissionPassNumber || 'PASS-00'}
                                  </span>
                                  {booking.patientName || 'Patient'}
                                  <span className="block text-[10px] text-slate-500 font-normal">{booking.contactPhone || 'Contact N/A'}</span>
                                </td>
                                <td className="p-3.5 font-semibold text-cyan-300">
                                  #{booking.allottedBedNumber || 'BED-01'} ({booking.allottedBedType || 'General Ward'})
                                </td>
                                <td className="p-3.5 text-slate-300">
                                  {booking.dischargedAt ? new Date(booking.dischargedAt).toLocaleString() : 'Discharged'}
                                </td>
                                <td className="p-3.5 text-slate-400 max-w-xs">
                                  <span className="truncate block">{booking.dischargeNotes || booking.hospitalNotes || 'Discharged in stable condition.'}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                    🏁 DISCHARGED (Bed Freed +1)
                                  </span>
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleDeleteBedBookingRecord(booking._id)}
                                    className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition shadow-sm"
                                    title="Permanently delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
                <span>Total Historical Records: {appointments.filter(a => a.status === 'COMPLETED').length + bedBookings.filter(b => b.status === 'DISCHARGED').length}</span>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                >
                  Close History
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}


