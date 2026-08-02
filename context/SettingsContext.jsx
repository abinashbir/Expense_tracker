import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { CURRENCIES } from '../utils/constants';
import { getSettings, setSetting } from '../db/queries';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const db = useSQLiteContext();
  const [currency, setCurrencyState] = useState('₹');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings(db);
        if (settings.currency) {
          setCurrencyState(settings.currency);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setIsLoaded(true);
    })();
  }, [db]);

  const setCurrency = useCallback(async (symbol) => {
    setCurrencyState(symbol);
    try {
      await setSetting(db, 'currency', symbol);
    } catch (e) {
      console.error('Failed to save currency:', e);
    }
  }, [db]);

  const getCurrencyInfo = useCallback(() => {
    return CURRENCIES.find(c => c.symbol === currency) || CURRENCIES[0];
  }, [currency]);

  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, getCurrencyInfo }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
