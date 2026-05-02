import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useMedicine } from '../context/MedicineContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Calendar as CalendarIcon, ArrowRight, User, Settings, Bell, ChevronLeft, ChevronRight, Activity, Pill, CheckCircle, Clock, MapPin, Edit2, Sparkles, Lightbulb
} from 'lucide-react';
import { getDaysUntilExpiry } from '../utils/formatDate';
import PendingRemindersWidget from '../components/PendingRemindersWidget';
import QuickFamilyWidget from '../components/QuickFamilyWidget';
import EditMedicineModal from '../components/EditMedicineModal';
import SearchModal from '../components/SearchModal';
import DailyHealthReviewWidget from '../components/DailyHealthReviewWidget';
import WomenHealthWidget from '../components/dashboard/WomenHealthWidget';
import CompleteProfileManager from '../components/CompleteProfileManager';
import HealthIntelligencePanel from '../components/HealthIntelligencePanel';
import CheckupModal from '../components/CheckupModal';
import DailyInsightWidget from '../components/DailyInsightWidget';
import QuickActionsWidget from '../components/QuickActionsWidget';

// Mini Line Chart Component for Stats
const MiniLineChart = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-16 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={color} className="shadow-sm drop-shadow-md" />
        );
      })}
    </svg>
  );
};

// Mini Bar Chart Component for Stats
const MiniBarChart = ({ data, colors }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between w-full h-16 gap-2">
      {data.map((val, i) => (
        <div 
          key={i} 
          className="w-full rounded-full transition-all duration-500 hover:opacity-80" 
          style={{ 
            height: `${Math.max((val / max) * 100, 10)}%`, 
            backgroundColor: colors[i % colors.length] 
          }}
        />
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { medicines, loading, getMedicines } = useMedicine();
  const navigate = useNavigate();
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isHealthPanelOpen, setIsHealthPanelOpen] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [checkups, setCheckups] = useState([]);
  const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);
  const [selectedCheckup, setSelectedCheckup] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/family/quick-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFamilyMembers(res.data.members);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
    }
  };

  const fetchCheckups = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/checkups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckups(res.data);
    } catch (err) {
      console.error('Error fetching checkups:', err);
    }
  };

  useEffect(() => {
    fetchCheckups();
    fetchFamilyMembers();
    const fetchIntelligence = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${API_URL}/dashboard/intelligence`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.exists) {
          setHealthData(res.data.snapshot);
        }
      } catch (err) {
        console.error("Error fetching intelligence widget data", err);
      }
    };
    fetchIntelligence();
  }, []);

  // Stats calculation
  const totalMedicines = medicines?.length || 0;
  
  const expiredCount = medicines?.filter(m => getDaysUntilExpiry(m.expiryDate) <= 0).length || 0;
  const expiring7 = medicines?.filter(m => { const d = getDaysUntilExpiry(m.expiryDate); return d > 0 && d <= 7; }).length || 0;
  const expiring30 = medicines?.filter(m => { const d = getDaysUntilExpiry(m.expiryDate); return d > 7 && d <= 30; }).length || 0;
  const expiring90 = medicines?.filter(m => { const d = getDaysUntilExpiry(m.expiryDate); return d > 30 && d <= 90; }).length || 0;
  const goodCount = medicines?.filter(m => getDaysUntilExpiry(m.expiryDate) > 90).length || 0;
  
  // Create 7 data points based on meds for the chart
  const medBarData = [
    expiredCount,
    expiring7,
    expiring30,
    totalMedicines > 0 ? Math.max(1, Math.floor(totalMedicines * 0.2)) : 0, // Mock middle variance
    expiring90,
    goodCount,
    totalMedicines > 0 ? Math.max(1, Math.floor(totalMedicines * 0.4)) : 0  // Mock variance
  ];
  
  const healthScore = healthData?.healthScore || user?.healthScore || 100;

  const handleEditSave = () => {
    window.location.reload();
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Add empty cells for offset
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Add days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
      
      // Find checkups for this day
      const dayCheckups = checkups.filter(c => {
        const d = new Date(c.date);
        return d.getDate() === i && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });

      days.push(
        <div key={i} className="relative group flex flex-col items-center">
          <div 
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all ${isToday ? 'bg-slate-900 dark:bg-emerald-500 text-white shadow-lg scale-110' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}`}
          >
            {i}
          </div>
          
          {/* Checkup dots */}
          {dayCheckups.length > 0 && (
            <div className="flex gap-0.5 mt-0.5">
              {dayCheckups.slice(0, 3).map((c, idx) => (
                <div 
                  key={c._id || idx} 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: c.color || '#10b981' }}
                />
              ))}
            </div>
          )}

          {/* Hover Bubble */}
          {dayCheckups.length > 0 && (
            <div 
              className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-52 rounded-2xl shadow-2xl border border-white/20 p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20 scale-90 group-hover:scale-100 origin-right backdrop-blur-md"
              style={{ 
                background: `linear-gradient(135deg, ${dayCheckups[0].color}ee, ${dayCheckups[0].color}cc)`,
                color: 'white'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Appointment</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCheckup(dayCheckups[0]);
                    setIsCheckupModalOpen(true);
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-base font-black leading-tight mb-2 drop-shadow-sm">{dayCheckups[0].title}</p>
              <div className="space-y-1.5">
                <p className="text-xs font-bold flex items-center gap-2 text-white/90">
                  <Clock className="w-3.5 h-3.5" /> {dayCheckups[0].time}
                </p>
                <p className="text-xs font-bold flex items-center gap-2 text-white/90">
                  <MapPin className="w-3.5 h-3.5" /> {dayCheckups[0].location}
                </p>
              </div>
              {dayCheckups.length > 1 && (
                <div className="mt-3 pt-2 border-t border-white/20">
                  <p className="text-[10px] font-black text-white">+{dayCheckups.length - 1} MORE EVENTS</p>
                </div>
              )}
              {/* Triangle pointer (pointing right) */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-0.5 border-8 border-transparent border-l-current" style={{ borderLeftColor: dayCheckups[0].color }}></div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-8 lg:p-10 font-sans transition-colors duration-300">
      <CompleteProfileManager />
      
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 xl:gap-10">
        
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8 lg:sticky lg:bottom-6 lg:self-end lg:h-max">
          
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-[46px] font-bold text-slate-800 dark:text-white leading-[1.1] mb-2 tracking-tight">
                Hi, {user?.name?.split(' ')[0] || 'User'}.<br/>
                Check your <span className="text-emerald-500">Health!</span>
              </h1>
            </motion.div>
            
            <div className="flex flex-col items-end gap-3 hidden md:flex">
             
              {(() => {
                const upcomingCheckup = checkups
                  .filter(c => new Date(c.date) >= new Date().setHours(0,0,0,0))
                  .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
                
                return (
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-800 pr-6 pl-3 py-3 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50">
                    <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/20 rounded-[18px] flex items-center justify-center text-pink-500">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-0.5">Next Checkup</p>
                      <p className="font-bold text-slate-800 dark:text-white text-base">
                        {upcomingCheckup 
                          ? new Date(upcomingCheckup.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'None Scheduled'
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Health Score Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              onClick={() => setIsHealthPanelOpen(true)}
              className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between h-[240px] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <h3 className="text-5xl font-bold flex items-baseline gap-2 text-slate-800 dark:text-white tracking-tight">
                  {healthScore} <span className="text-xl font-bold text-slate-400">/ 100</span>
                </h3>
              </div>
              <div className="w-full px-2 mt-4">
                <MiniLineChart data={[60, 65, 62, 70, 75, 80, healthScore]} color="#10b981" />
              </div>
              <p className="text-slate-800 dark:text-white font-bold text-lg mt-4 text-center">Health Score</p>
            </motion.div>

            {/* Medicines Stats Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              onClick={() => navigate('/medicines')}
              className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between h-[240px] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <h3 className="text-5xl font-bold flex items-baseline gap-2 text-slate-800 dark:text-white tracking-tight">
                  {totalMedicines} <span className="text-xl font-bold text-slate-400">Meds</span>
                </h3>
              </div>
              <div className="w-full px-4 mt-4">
                 <MiniBarChart 
                   data={medBarData.every(v => v === 0) ? [1, 1, 1, 1, 1, 1, 1] : medBarData} 
                   colors={['#f472b6', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf']} 
                 />
              </div>
              <p className="text-slate-800 dark:text-white font-bold text-lg mt-4 text-center">Active Prescriptions</p>
            </motion.div>
          </div>
          
          {/* Women's Health Section (Conditionally rendered inside the component) */}
          <WomenHealthWidget />

          <DailyInsightWidget />

          {/* Functional Quick Actions Panel to fill empty space */}
          <QuickActionsWidget 
            onAddCheckup={() => setIsCheckupModalOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          <DailyHealthReviewWidget />
         

        </div>

        {/* RIGHT COLUMN - Widgets & Info */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
          
          {/* Calendar Widget */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Calendar</h3>
                <button 
                  onClick={() => {
                    setSelectedCheckup(null);
                    setIsCheckupModalOpen(true);
                  }}
                  className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-all scale-90 hover:scale-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-5 py-2 rounded-full text-sm font-bold cursor-pointer hover:bg-slate-800 transition-colors">
                {currentDate.toLocaleString('default', { month: 'short' })}
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-6 gap-x-2 mb-2 place-items-center">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-xs font-bold text-slate-400 tracking-wider">{day}</div>
              ))}
              {renderCalendar()}
            </div>
          </motion.div>

          {/* Pending Reminders Widget Integration */}
          <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 overflow-hidden">
             <PendingRemindersWidget />
          </div>

          {/* Informations Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white">Informations</h3>
            </div>

            <div className="mb-8">
              <p className="text-sm font-bold text-emerald-500 tracking-widest flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> DETAILS
              </p>
              <div className="flex justify-between bg-[#f8fafc] dark:bg-slate-900/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Blood</p>
                  <p className="font-black text-slate-800 dark:text-white text-xl">{user?.bloodGroup || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Height</p>
                  <p className="font-black text-slate-800 dark:text-white text-xl">
                    {user?.height || '---'} <span className="text-sm font-bold text-slate-400">cm</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Weight</p>
                  <p className="font-black text-slate-800 dark:text-white text-xl">
                    {user?.weight || '---'} <span className="text-sm font-bold text-slate-400">kg</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-pink-500 tracking-widest flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> FAMILY
              </p>
              <div className="bg-[#f8fafc] dark:bg-slate-900/50 p-4 pl-6 rounded-[24px] flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <div className="flex -space-x-4">
                  {familyMembers.length > 0 ? (
                    <>
                      {familyMembers.slice(0, 3).map((member, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-[#f8fafc] dark:border-slate-900 bg-emerald-100 flex items-center justify-center overflow-hidden shadow-sm">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                      ))}
                      {familyMembers.length > 3 && (
                        <div className="w-12 h-12 rounded-full border-4 border-[#f8fafc] dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-black text-slate-500 shadow-sm">
                          +{familyMembers.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-full border-4 border-[#f8fafc] dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                       <Plus className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <Link to="/family" className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-emerald-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

          </motion.div>

        </div>
      </div>

      {/* Edit Modal */}
      {editingMedicine && (
        <EditMedicineModal
          medicine={editingMedicine}
          onClose={() => setEditingMedicine(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Search Modal */}
      <SearchModal 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          medicines={medicines}
      />

      {/* Health Intelligence Panel */}
      <HealthIntelligencePanel 
        isOpen={isHealthPanelOpen} 
        onClose={() => setIsHealthPanelOpen(false)} 
      />

      {/* Checkup Modal */}
      <CheckupModal 
        isOpen={isCheckupModalOpen}
        onClose={() => setIsCheckupModalOpen(false)}
        checkup={selectedCheckup}
        onSave={() => fetchCheckups()}
        onDelete={() => fetchCheckups()}
      />
    </div>
  );
};

export default Dashboard;
