import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../services/i18n';

const AppModeContext = createContext();

export const triggerGoogleTranslate = (langCode) => {
  if (!langCode) return;
  
  // Set cookie for google translate engine
  const hostname = window.location.hostname;
  document.cookie = `googtrans=/en/${langCode}; path=/;`;
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname};`;
  }

  // Update Google Translate widget select dropdown
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change'));
      clearInterval(interval);
    } else if (attempts >= 25) {
      clearInterval(interval);
    }
  }, 100);
};

export const AppModeProvider = ({ children }) => {
  const [activeMode, setActiveMode] = useState(() => {
    return localStorage.getItem('meditrack_active_mode') || 'MY_HEALTH';
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('meditrack_language') || 'en';
  });

  const setLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem('meditrack_language', langCode);
    triggerGoogleTranslate(langCode);
  };

  useEffect(() => {
    localStorage.setItem('meditrack_active_mode', activeMode);
  }, [activeMode]);

  useEffect(() => {
    // Initial sync on mount if saved language is not 'en'
    const savedLang = localStorage.getItem('meditrack_language') || 'en';
    if (savedLang !== 'en') {
      triggerGoogleTranslate(savedLang);
    }
  }, []);

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

