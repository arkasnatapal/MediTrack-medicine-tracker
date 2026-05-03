import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, isAuthenticated }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // If no theme is saved, OR if it was 'system' (legacy default), force 'dark' as the new default
    if (!savedTheme || savedTheme === 'system') {
      return 'dark';
    }
    return savedTheme;
  });

  // Force light mode for unauthenticated users (Landing, Login, Signup)
  const activeTheme = isAuthenticated ? theme : 'light';

  useEffect(() => {
    const root = window.document.documentElement;
    
    const removeOldTheme = () => {
      root.classList.remove('light', 'dark');
    };

    const applyTheme = (themeToApply) => {
      removeOldTheme();
      root.classList.add(themeToApply);
    };

    if (activeTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(activeTheme);
    }

    // Still save the actual preference to localStorage if authenticated
    if (isAuthenticated) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, activeTheme, isAuthenticated]);

  const value = {
    theme: activeTheme,
    setTheme,
    actualPreference: theme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
