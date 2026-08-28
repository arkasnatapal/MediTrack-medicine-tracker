import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../services/i18n';

const AppModeContext = createContext();

export const AppModeProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState(() => {
    return localStorage.getItem('meditrack_active_mode') || 'MY_HEALTH';
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('meditrack_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('meditrack_active_mode', activeMode);
  }, [activeMode]);

  useEffect(() => {
    localStorage.setItem('meditrack_language', language);
  }, [language]);

  const t = (key) => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <AppModeContext.Provider value={{ activeMode, setActiveMode, language, setLanguage, t }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};
