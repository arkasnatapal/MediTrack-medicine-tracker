import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiveKitCallModal from '../../components/calling/LiveKitCallModal';
import {
  Building2, Calendar, Users, ArrowUpRight, ArrowDownLeft, Stethoscope,
  Activity, Package, Bed, ShieldAlert, LogOut, CheckCircle, Clock, Plus, RefreshCw, Send, AlertTriangle, Layers, Edit3, Save, X, Video, UserCheck, Trash2, UserPlus
} from 'lucide-react';


export default function FacilityDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-[140px]">{user?.facility?.name || 'Care Facility'}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                {user?.verificationStatus || 'PENDING'}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'doctors', label: 'Doctors & Staff', icon: Stethoscope },
              { id: 'teleconsultations', label: 'Teleconsult Allocations', icon: Video },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
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
          <button onClick={loadDashboardData} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
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

        {/* Fallback for other tabs */}
        {['transfers', 'inventory', 'appointments', 'referrals'].includes(activeTab) && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 capitalize">{activeTab} Console</h3>
            <p className="text-xs text-slate-400">Manage all facility records for {activeTab}.</p>
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

      </main>
    </div>
  );
}

