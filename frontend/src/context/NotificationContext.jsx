import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import NotificationToast from '../components/NotificationToast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message, duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Helper functions for cleaner usage
  const notify = useCallback((type, message, duration) => {
    addNotification(type, message, duration);
  }, [addNotification]);

  notify.success = (message, duration) => addNotification('success', message, duration);
  notify.error = (message, duration) => addNotification('error', message, duration);
  notify.warning = (message, duration) => addNotification('warning', message, duration);
  notify.info = (message, duration) => addNotification('info', message, duration);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              {...notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
