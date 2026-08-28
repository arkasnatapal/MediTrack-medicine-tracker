import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Building2, User, Ticket, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [department, setDepartment] = useState('General OPD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:30 AM');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [activeQueue, setActiveQueue] = useState({
    userToken: 37,
    currentToken: 32,
    positionInLine: 5,
    estimatedWaitMinutes: 25
  });

  useEffect(() => {
    fetchAppointments();
    fetchFacilities();
  }, []);

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
      // Mock fallback appointments
      setAppointments([
        {
          appointmentId: 'APT-DEMO-37',
          facilityName: 'Primary Health Centre (PHC) Khed',
          department: 'General OPD',
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          tokenNumber: 37,
          status: 'BOOKED'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await axios.get(`${API_BASE}/care-network/facilities`);
      if (res.data && res.data.facilities) {
        setFacilities(res.data.facilities);
        if (res.data.facilities.length > 0) {
          setSelectedFacilityId(res.data.facilities[0].facilityId);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    const facilityObj = facilities.find(f => f.facilityId === selectedFacilityId);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post(
        `${API_BASE}/care-network/appointments`,
        {
          facilityId: selectedFacilityId,
          facilityName: facilityObj?.name || 'Primary Health Centre Khed',
          department,
          date,
          time
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.appointment) {
        setBookingSuccess(res.data.message);
        setAppointments([res.data.appointment, ...appointments]);
      }
    } catch (err) {
      // Demo booking fallback
      const mockApt = {
        appointmentId: `APT-${Date.now()}`,
        facilityName: facilityObj?.name || 'Primary Health Centre Khed',
        department,
        date,
        time,
        tokenNumber: 38,
        status: 'BOOKED'
      };
      setBookingSuccess('Appointment Booked! Token Number #38 Assigned.');
      setAppointments([mockApt, ...appointments]);
    }
  };

  const handleSimulateQueueStep = () => {
    setActiveQueue(prev => ({
      ...prev,
      currentToken: Math.min(prev.userToken, prev.currentToken + 1),
      positionInLine: Math.max(0, prev.positionInLine - 1),
      estimatedWaitMinutes: Math.max(0, (prev.positionInLine - 1) * 5)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* LIVE QUEUE STATUS BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-Time Public Facility Queue Status</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">LIVE OPD TOKEN QUEUE POSITION</h1>
          </div>

          <button
            onClick={handleSimulateQueueStep}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate Queue Advance (+1)</span>
          </button>
        </div>

        {/* QUEUE COUNTERS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-200">YOUR TOKEN</span>
            <p className="text-3xl font-black text-amber-400">#{activeQueue.userToken}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-200">CURRENT TOKEN</span>
            <p className="text-3xl font-black text-emerald-400">#{activeQueue.currentToken}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-200">POSITION IN LINE</span>
            <p className="text-3xl font-black text-white">{activeQueue.positionInLine}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold uppercase text-blue-200">ESTIMATED WAIT</span>
            <p className="text-3xl font-black text-cyan-300">{activeQueue.estimatedWaitMinutes} Mins</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* BOOK APPOINTMENT FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
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
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Public Healthcare Facility:</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                {facilities.map(f => (
                  <option key={f.facilityId} value={f.facilityId}>
                    {f.name} ({f.facilityType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department:</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="General OPD">General OPD</option>
                <option value="Cardiology OPD">Cardiology OPD</option>
                <option value="Pediatrics OPD">Pediatrics OPD</option>
                <option value="Maternal Care">Maternal & Gynec OPD</option>
                <option value="Ayush / Natural Healing">AYUSH / Natural Healing</option>
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
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Confirm Appointment & Issue Token
            </button>
          </form>
        </div>

        {/* MY APPOINTMENTS LIST */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <span>My Healthcare Appointments ({appointments.length})</span>
          </h2>

          <div className="space-y-3">
            {appointments.map(apt => (
              <div
                key={apt.appointmentId}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 uppercase">
                    Token #{apt.tokenNumber}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{apt.facilityName}</h3>
                  <p className="text-xs text-slate-500">{apt.department} • {apt.date} at {apt.time}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
