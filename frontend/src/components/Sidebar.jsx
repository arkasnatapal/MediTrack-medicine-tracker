import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, Settings, HelpCircle, ChevronLeft, ChevronRight, Users, Bell, Sparkles, Sun, Moon, Utensils, FolderOpen, Network, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { getUnreadCount } from '../api/chat';
import { getInvitations } from '../api/family';

const Sidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const [chatData, invitationsData] = await Promise.all([
          getUnreadCount(),
          getInvitations()
        ]);
        
        const invitesCount = invitationsData.invitations ? invitationsData.invitations.length : 0;
        setUnreadCount(chatData.count + invitesCount);
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, []);
  
  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Add Medicine', path: '/add-medicine', icon: PlusCircle },
    { name: 'My Medicines', path: '/medicines', icon: List },
    { name: 'Folders', path: '/medicine-folders', icon: FolderOpen },
    { name: 'Reminders', path: '/reminders', icon: Bell },
    { name: 'Food Routine', path: '/food', icon: Utensils },
    { name: 'Family', path: '/family', icon: Users, badge: unreadCount },
    { name: 'Health Review', path: '/health-review', icon: Network },
    { name: 'Medical Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Support', path: '/contact', icon: HelpCircle },
  ];

  return (
    <>
      {/* Spacer to push content */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:block flex-shrink-0 bg-transparent transition-all duration-300"
      />

      {/* Fixed Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isCollapsed ? '5rem' : '16rem' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 h-[calc(100vh-4rem)] fixed top-16 left-0 z-30 shadow-lg"
      >
        {/* Gradient Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-32 bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative flex-1 flex flex-col pt-5 pb-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <nav className="flex-1 px-3 space-y-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  title={isCollapsed ? link.name : ''}
                  className="relative group block"
                >
                  <div
                    className={`relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    {/* Active Background Gradient */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Icon Container */}
                    <div className="relative z-10 flex items-center justify-center">
                      <link.icon
                        className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500 dark:text-slate-500 dark:group-hover:text-emerald-400'
                        } ${!isCollapsed && 'mr-3'}`}
                      />
                      
                      {/* Badge for collapsed view */}
                      {link.badge > 0 && isCollapsed && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                        </span>
                      )}
                    </div>
                    
                    {/* Label */}
                    {!isCollapsed && (
                      <div className="relative z-10 flex-1 flex items-center justify-between overflow-hidden">
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className={`whitespace-nowrap font-medium text-sm ${isActive ? 'text-white' : ''}`}
                        >
                          {link.name}
                        </motion.span>
                        
                        {link.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {link.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="relative p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-between gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isCollapsed ? 'mx-auto' : ''}`}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${isCollapsed ? 'hidden' : ''}`}
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Show expand button only when collapsed and not showing theme toggle (or maybe stack them?) 
              Actually, when collapsed, where is the expand button? 
              The original code had the expand button centered when collapsed.
              Let's put them in a column if collapsed? Or just keep the expand button.
              
              Let's try to fit both.
          */}
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute top-[-3rem] left-1/2 transform -translate-x-1/2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              title="Expand Sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;