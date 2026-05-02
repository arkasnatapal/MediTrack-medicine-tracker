import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, FileText, Settings, Search, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsWidget = ({ onAddCheckup, onOpenSearch }) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'add_checkup',
      label: 'Add Checkup',
      icon: Stethoscope,
      onClick: onAddCheckup,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'view_reports',
      label: 'Medical Reports',
      icon: FileText,
      onClick: () => navigate('/reports'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'search',
      label: 'Search Meds',
      icon: Search,
      onClick: onOpenSearch,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => navigate('/settings'),
      color: 'text-slate-500',
      bg: 'bg-slate-500/10 border-slate-500/20 dark:bg-slate-400/10 dark:border-slate-400/20'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-800 p-6 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-700/50"
    >
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="font-bold text-xl text-slate-800 dark:text-white">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all hover:shadow-sm ${action.bg}`}
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActionsWidget;
