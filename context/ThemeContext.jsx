import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { LIGHT_THEME, DARK_THEME } from '../utils/constants';
import { getSettings, setSetting } from '../db/queries';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const db = useSQLiteContext();
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine effective theme
  const isDark = mode === 'system'
    ? systemScheme === 'dark'
    : mode === 'dark';

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  // Load preference from DB
  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings(db);
        if (settings.darkMode) {
          setMode(settings.darkMode);
        }
      } catch (e) {
        console.error('Failed to load theme setting:', e);
      }
      setIsLoaded(true);
    })();
  }, [db]);

  const setThemeMode = useCallback(async (newMode) => {
    setMode(newMode);
    try {
      await setSetting(db, 'darkMode', newMode);
    } catch (e) {
      console.error('Failed to save theme setting:', e);
    }
  }, [db]);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
  }, [isDark, setThemeMode]);

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
