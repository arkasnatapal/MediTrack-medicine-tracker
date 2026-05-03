import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Meh, Frown, Zap, Activity, Thermometer, 
  Wind, Check, Send, AlertCircle, Heart, Star
} from 'lucide-react';
import axios from 'axios';

const DailyStatusWidget = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggedToday, setLoggedToday] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [mood, setMood] = useState('good');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [bodyStatus, setBodyStatus] = useState([]);
  const [notes, setNotes] = useState('');

  const moods = [
    { id: 'excellent', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Amazing' },
    { id: 'good', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Good' },
    { id: 'neutral', icon: Meh, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Okay' },
    { id: 'bad', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Poor' },
    { id: 'awful', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Awful' },
  ];

  const symptoms = [
    { id: 'Normal', icon: Activity },
    { id: 'Pain', icon: Thermometer },
    { id: 'Nausea', icon: Wind },
    { id: 'Fever', icon: Thermometer },
    { id: 'Fatigue', icon: Zap },
    { id: 'Headache', icon: AlertCircle },
  ];

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${API_URL}/daily-status/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.exists) {
        setLoggedToday(true);
        const { mood, energyLevel, bodyStatus, notes } = res.data.status;
        setMood(mood);
        setEnergyLevel(energyLevel);
        setBodyStatus(bodyStatus);
        setNotes(notes);
      }
    } catch (err) {
      console.error('Error fetching daily status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSymptom = (id) => {
    setBodyStatus(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL;
      await axios.post(`${API_URL}/daily-status`, {
        mood, energyLevel, bodyStatus, notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoggedToday(true);
      setShowForm(false);
    } catch (err) {
      console.error('Error saving daily status:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-[200px] bg-white dark:bg-slate-800 rounded-[40px] animate-pulse" />
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" />
            Daily Check-in
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track how you feel today</p>
        </div>
        {loggedToday && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full"
          >
            Update
          </button>
        )}
      </div>

      {!loggedToday || showForm ? (
        <div className="space-y-6">
          {/* Mood Selection */}
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-300 ${
                  mood === m.id ? m.bg + ' scale-105' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <m.icon className={`w-8 h-8 ${mood === m.id ? m.color : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold ${mood === m.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Energy Level</span>
              <span className="text-lg font-black text-emerald-500">{energyLevel}</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Body Status Symptoms */}
          <div className="space-y-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Body Status</span>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleToggleSymptom(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                    bodyStatus.includes(s.id)
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.id}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea 
            placeholder="Add a quick note about your day..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none h-20"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-slate-900 dark:bg-emerald-500 text-white rounded-[24px] font-bold shadow-lg shadow-slate-900/20 hover:shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Saving...' : (
              <>
                <Send className="w-4 h-4" />
                Log Daily Status
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-[28px] border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
              {(() => {
                const currentMood = moods.find(m => m.id === mood) || moods[1];
                const Icon = currentMood.icon;
                return <Icon className={`w-8 h-8 ${currentMood.color}`} />;
              })()}
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Today's Mood</p>
              <p className="text-lg font-black text-slate-800 dark:text-white capitalize">{mood}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Energy</p>
              <p className="text-lg font-black text-emerald-500">{energyLevel}/10</p>
            </div>
          </div>

          {bodyStatus.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bodyStatus.map(s => (
                <span key={s} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold">
                  {s}
                </span>
              ))}
            </div>
          )}

          {notes && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{notes}"</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            <Check className="w-3 h-3" />
            Great! You've logged your status for today.
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DailyStatusWidget;
