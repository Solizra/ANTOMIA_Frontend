import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Por defecto modo oscuro

  useEffect(() => {
    // Cargar tema guardado desde localStorage o preferencias del usuario
    const savedTheme = localStorage.getItem('theme');
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    
    // Si no hay tema guardado, establecer modo oscuro por defecto
    if (!savedTheme && userPreferences.darkMode === undefined) {
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
      const defaultPreferences = { darkMode: true };
      localStorage.setItem('userPreferences', JSON.stringify(defaultPreferences));
    } else if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else if (userPreferences.darkMode !== undefined) {
      setIsDarkMode(userPreferences.darkMode);
    }
  }, []);

  useEffect(() => {
    // Aplicar tema al documento
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Actualizar preferencias del usuario
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    userPreferences.darkMode = isDarkMode;
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setTheme = (darkMode) => {
    setIsDarkMode(darkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
