import React, { useEffect, useState } from "react";
import { Bell, X, CheckCheck, Trash2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReminderActionModal from "./ReminderActionModal";
import ConfirmDialog from "./ConfirmDialog";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastNotifIds, setLastNotifIds] = useState(new Set());
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [currentPendingReminder, setCurrentPendingReminder] = useState(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const [networkUnstable, setNetworkUnstable] = useState(false);

  // Network status detection
  useEffect(() => {
    let debounceTimer;

    const updateNetworkStatus = () => {
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        const isOnline = navigator.onLine;
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        const isSlowType = connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false;
        const isHighLatency = connection && connection.rtt ? connection.rtt > 1000 : false;
        const isLowBandwidth = connection && connection.downlink ? connection.downlink < 0.5 : false;
        
        setNetworkUnstable(!isOnline || isSlowType || isHighLatency || isLowBandwidth);
      }, 2000);
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
    }

    updateNetworkStatus();

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { default: api } = await import('../api/api');
      const res = await api.get("/notifications");
      
      if (res.data.success) {
        const newNotifs = res.data.notifications || [];
        
        if (lastNotifIds.size > 0) {
          const newReminderNotifs = newNotifs.filter(
            n => n.type === 'medicine_reminder' && !lastNotifIds.has(n._id)
          );
          
          if (newReminderNotifs.length > 0) {
            playAlarmSound();
            
            const latestReminder = newReminderNotifs[0];
            try {
              const pendingRes = await api.get("/pending-reminders");
              if (pendingRes.data.success) {
                const pending = pendingRes.data.pendingReminders.find(
                  pr => pr.medicine?._id === latestReminder.meta?.medicineId
                );
                if (pending) {
                  setCurrentPendingReminder(pending);
                  setShowReminderModal(true);
                }
              }
            } catch (err) {
              console.error("Failed to fetch pending reminder:", err);
            }
          }
        }
        
        setNotifications(newNotifs);
        setUnreadCount(res.data.unreadCount || 0);
        setLastNotifIds(new Set(newNotifs.map(n => n._id)));
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setNetworkUnstable(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.error('Failed to play alarm sound:', err);
    }
  };

  const displayNotifications = networkUnstable ? [
    {
      _id: 'network-warning',
      title: 'Unstable Network',
      message: 'Please check your internet connection for a smooth experience.',
      type: 'system_error',
      severity: 'warning',
      read: false,
      createdAt: new Date().toISOString()
    },
    ...notifications
  ] : notifications;

  const displayUnreadCount = networkUnstable ? unreadCount + 1 : unreadCount;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      const { default: api } = await import('../api/api');
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const { default: api } = await import('../api/api');
      await api.post("/notifications/read", { id });
      setNotifications((prev) => 
        prev.map((n) => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    
    if (id === 'network-warning') {
      setNetworkUnstable(false);
      return;
    }

    try {
      const { default: api } = await import('../api/api');
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      const wasUnread = notifications.find(n => n._id === id)?.read === false;
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = async () => {

    try {
      const { default: api } = await import('../api/api');
      
      // Filter out network warning and get only real notification IDs
      const realNotifications = notifications.filter(n => n._id !== 'network-warning');
      
      if (realNotifications.length === 0) {
        // Only network warning exists, just clear it
        setNetworkUnstable(false);
        return;
      }
      
      // Delete all real notifications
      await Promise.all(
        realNotifications.map(n => 
          api.delete(`/notifications/${n._id}`).catch(err => {
            console.error(`Failed to delete notification ${n._id}:`, err);
            return null; // Continue with other deletions even if one fails
          })
        )
      );
      
      // Clear state
      setNotifications([]);
      setUnreadCount(0);
      setNetworkUnstable(false); // Also clear network warning
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    } finally {
      setShowDeleteAllDialog(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 focus:outline-none"
        >
          <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
          {displayUnreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold leading-none text-white border-2 border-white dark:border-slate-900 shadow-lg"
            >
              {displayUnreadCount > 9 ? "9+" : displayUnreadCount}
            </motion.span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar/Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl z-50 border-l border-white/20 dark:border-slate-800 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Notifications
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                    </h3>
                    {displayUnreadCount > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {displayUnreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {displayUnreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-5 w-5" />
                    </button>
                  )}
                  {displayNotifications.length > 0 && (
                    <button
                      onClick={handleDeleteAllClick}
                      className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
                      title="Delete all notifications"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={toggleOpen}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {loading && displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                    <div className="animate-spin h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
                    <p className="text-sm font-medium">Loading notifications...</p>
                  </div>
                ) : displayNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">No notifications yet</p>
                    <p className="text-xs mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {displayNotifications.map((n, index) => (
                      <motion.div
                        key={n._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => !n.read && n._id !== 'network-warning' && handleMarkRead(n._id)}
                        className={`relative p-4 rounded-2xl transition-all cursor-pointer group ${
                          n.read 
                            ? "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80" 
                            : "bg-emerald-50/80 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50"
                        } ${n._id === 'network-warning' ? 'border-l-4 !border-l-amber-500 bg-amber-50/80 dark:bg-amber-900/20' : ''}`}
                      >
                        <div className="flex gap-3 pr-8">
                          {!n.read && n._id !== 'network-warning' && (
                            <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-lg shadow-emerald-500/50" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${
                              n.read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'
                            }`}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {n.type === 'family_invitation' && !n.read && (
                          <div className="mt-3 flex gap-2 pl-5">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const { acceptInvitation } = await import('../api/family');
                                  await acceptInvitation(n.meta.invitationId);
                                  handleMarkRead(n._id);
                                  window.location.reload(); 
                                } catch (err) {
                                  console.error("Failed to accept:", err);
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const { declineInvitation } = await import('../api/family');
                                  await declineInvitation(n.meta.invitationId);
                                  handleMarkRead(n._id);
                                } catch (err) {
                                  console.error("Failed to decline:", err);
                                }
                              }}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {/* AI Consent Request Action */}
                        {n.title === 'AI action requested' && !n.read && (
                           <div className="mt-3 flex gap-2 pl-5">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 // Navigate to family settings or just show a message
                                 // Ideally we should have a direct API to approve, but for now let's redirect to family settings
                                 // Since we don't have a specific "approve consent" API in the plan, we rely on the user toggling the setting.
                                 // But wait, the plan said "Add toggle for allowAiActions".
                                 // So we should redirect them to the family page or open a modal.
                                 // Let's redirect to /family/settings if it exists, or just /family
                                 window.location.href = '/family'; 
                                 handleMarkRead(n._id);
                               }}
                               className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                             >
                               Go to Settings
                             </button>
                           </div>
                        )}

                        <button
                          onClick={(e) => handleDelete(e, n._id)}
                          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reminder Action Modal */}
      {showReminderModal && currentPendingReminder && (
        <ReminderActionModal
          pendingReminder={currentPendingReminder}
          onClose={() => {
            setShowReminderModal(false);
            setCurrentPendingReminder(null);
            fetchNotifications();
          }}
          onConfirm={() => {
            setShowReminderModal(false);
            setCurrentPendingReminder(null);
            fetchNotifications();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
        title="Delete All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default NotificationBell;
