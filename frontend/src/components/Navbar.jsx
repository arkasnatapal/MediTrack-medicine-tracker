import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Pill, User, LogOut, LayoutDashboard, Settings, Moon, Sun, Users, AlertTriangle, ChevronRight, Bot, Bell, Group, UsersRound, Files, Folder, Folders, Utensils, Plus, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const navLinks = !user ? [
    // { name: 'Home', path: '/' },
    // { name: 'Contact', path: '/contact' },
  ] :[];

  const authLinks = user ? [
    // { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    // { name: 'Medicines', path: '/medicines', icon: Pill },
    
  ] : [];

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <div className=" p-1.5 rounded-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">MediTrack</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600 hover:border-b-2 hover:border-primary-600 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
              {authLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary-600 hover:border-b-2 hover:border-primary-600 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <button
                  type="button"
                  onClick={() => navigate("/ai-assistant")}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                  title="Open MediTrack AI Assistant"
                >
                  <Bot className="h-6 w-6" />
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-700 transition-all">
                      <UserAvatar 
                        user={user} 
                        className="h-full w-full" 
                        fallbackType="icon"
                      />
                    </div>
                    {/* <span className="hidden sm:block">{user.name.split(' ')[0]}</span> */}
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                              <UserAvatar 
                                user={user} 
                                className="h-full w-full" 
                                fallbackType="initial"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="p-2 space-y-1">
                          {/* Theme Toggle */}
                          <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                              </div>
                              <span className="font-medium">Appearance</span>
                            </div>
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md capitalize">
                              {theme}
                            </span>
                          </button>

                          {/* Manage Family */}
                          <Link
                            to="/family"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <Users size={18} />
                              </div>
                              <span className="font-medium">Manage Family</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </Link>

                          {/* Expiring Medicines */}
                          <Link
                            to="/expiring-medicines"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                                <AlertTriangle size={18} />
                              </div>
                              <span className="font-medium">Expiring Medicines</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </Link>

                          {/* Settings */}
                          <Link
                            to="/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                <Settings size={18} />
                              </div>
                              <span className="font-medium">Profile Settings</span>
                            </div>
                          </Link>

                          <div className="h-px bg-gray-100 dark:bg-slate-700 my-1" />

                          {/* Logout */}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                              <LogOut size={18} />
                            </div>
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link to="/login" className=" btn-primary text-sm font-medium hover:text-primary-600 transition-colors duration-200">
                  Log in
                </Link>
                {/* <Link to="/signup" className="btn-primary text-sm">
                  Sign up
                </Link> */}
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center md:hidden gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-slate-300 hover:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-gray-200 dark:border-slate-700 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                <span className="font-bold text-lg text-gray-900 dark:text-white">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
                <Link
                  to="/medicines"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Pill className="h-5 w-5 mr-3" />
                  Medicines
                </Link>
                <Link
                  to="/add-medicine"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Add Medicines
                </Link>
                <Link
                  to="/ai-assistant"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Bot className="h-5 w-5 mr-3" />
                  AI Assistant
                </Link>
                <Link
                  to="/medicine-folders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Folders className="h-5 w-5 mr-3" />
                  Medicine Folders
                </Link>
                <Link
                  to="/food"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Utensils className="h-5 w-5 mr-3" />
                    Food
                </Link>
                <Link
                  to="/reminders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Bell className="h-5 w-5 mr-3" />
                  Reminders
                </Link>
                 <Link
                  to="/family"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <UsersRound className="h-5 w-5 mr-3" />
                  Family
                </Link>
                 <Link
                  to="/health-review"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Network className="h-5 w-5 mr-3" />
                  Health Review
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <User className="h-5 w-5 mr-3" />
                  Contact Us
                </Link>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                {user ? (
                  <Link 
                    to="/settings" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-3 rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 group-hover:border-primary-200 dark:group-hover:border-primary-700 transition-colors">
                        <UserAvatar 
                          user={user} 
                          className="h-full w-full" 
                          fallbackType="icon"
                        />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    <Settings className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
                
                {user && (
                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;