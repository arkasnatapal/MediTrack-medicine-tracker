import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageCircle, Clock, Plus, UserPlus, ChevronRight, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const QuickFamilyWidget = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamilyOverview = async () => {
      try {
        const res = await api.get('/family/quick-overview');
        if (res.data.success) {
          setMembers(res.data.members);
        }
      } catch (err) {
        console.error('Error fetching family overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyOverview();
    const interval = setInterval(fetchFamilyOverview, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 h-[280px] flex items-center justify-center overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-50" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700/30 overflow-hidden min-h-[280px] h-full flex flex-col group"
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[60px] group-hover:bg-fuchsia-500/20 transition-colors duration-700" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl shadow-lg text-white">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Family Circle
            </h3>
            <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
              {members.length} Connected
            </p>
          </div>
        </div>
        
        <Link 
          to="/family"
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative flex-1 flex items-center overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-4 w-full">
          <AnimatePresence mode='popLayout'>
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                className="relative flex-shrink-0  snap-center"
              >
                <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 group/card hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 z-10 ${
                     member.status !== 'active' ? 'bg-amber-400' :
                     new Date(member.lastActive) > new Date(Date.now() - 5 * 60 * 1000) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'
                  }`} />

                  {/* Avatar */}
                  <div className="relative mx-auto w-16 h-16 mb-3">
                    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 p-0.5 overflow-hidden shadow-inner">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-[14px]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-[14px]">
                          <span className="text-xl font-black text-slate-400">{member.name[0]}</span>
                        </div>
                      )}
                    </div>
                    {/* Unread Badge */}
                    {member.status === 'active' && member.unreadMessages > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -left-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg z-20"
                      >
                        <span className="text-[10px] font-bold text-white">{member.unreadMessages}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="text-center mb-3">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-0.5">
                      {member.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                      {member.relationship || (member.status === 'active' ? 'Family' : member.status)}
                    </p>
                  </div>

                  {/* Next Reminder Pill */}
                  {member.nextReminder ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-2 mb-3 border border-indigo-100 dark:border-indigo-500/20">
                      <div className="flex items-center gap-1.5 justify-center text-indigo-600 dark:text-indigo-400 mb-0.5">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold">Next Dose</span>
                      </div>
                      <p className="text-[10px] text-center font-medium text-slate-600 dark:text-slate-300 truncate px-1">
                        {member.nextReminder.medicineName}
                      </p>
                    </div>
                  ) : (
                     <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 mb-3 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-1.5 justify-center text-slate-400 mb-0.5">
                            <Heart className="h-3 w-3" />
                            <span className="text-[10px] font-bold">All Good</span>
                        </div>
                         <p className="text-[10px] text-center font-medium text-slate-400 truncate px-1">
                            No reminders
                        </p>
                     </div>
                  )}

                  {/* Actions (Hover) */}
                  <div className="flex gap-2 justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover/card:translate-y-0">
                    <Link to={`/family/chat/${member.id}`} className="p-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Link>
                    <Link to={`/family/member/${member.id}`} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Member Card */}
            <motion.div 
              layout
              className={`relative flex-shrink-0 snap-center h-full ${members.length === 0 ? 'w-full' : 'w-40'}`}
            >
               <Link to="/family" className="block h-full">
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[1.5rem] hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-300 group/add">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3 group-hover/add:scale-110 transition-transform duration-300">
                        <Plus className="h-6 w-6 text-slate-400 dark:text-slate-500 group-hover/add:text-indigo-500 transition-colors" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/add:text-indigo-600 dark:group-hover/add:text-indigo-400 transition-colors">
                        Add Member
                    </span>
                </div>
               </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickFamilyWidget;
