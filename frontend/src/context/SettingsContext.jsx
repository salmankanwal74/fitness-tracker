import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSettings, updateSettings as updateSettingsApi } from '../services/settingsService';

const DEFAULT_SETTINGS = {
  theme: 'light',
  weightUnit: 'kg',
  lengthUnit: 'cm',
  notifications: {
    workoutMilestones: true,
    streaks: true,
    weightProgress: true,
    mealReminders: true,
  },
};

const SettingsContext = createContext();

// Theme ko <html> tag par lagata hai taake CSS variables switch ho sakein
const applyThemeToDocument = (theme) => {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => {
    // Login se pehle bhi last-known theme use karo, taake flash na ho
    const cachedTheme = localStorage.getItem('theme');
    return cachedTheme ? { ...DEFAULT_SETTINGS, theme: cachedTheme } : DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyThemeToDocument(settings.theme);
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Settings load nahi hui, defaults use ho rahi hain', error);
      }
      setLoading(false);
    })();
  }, [user]);

  // "system" theme select ho to OS ka dark/light switch follow karo
  useEffect(() => {
    if (settings.theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDocument('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [settings.theme]);

  const updateSettings = useCallback(async (partial) => {
    // Pehle UI turant update karo (optimistic), phir backend save karo
    setSettings((prev) => ({
      ...prev,
      ...partial,
      notifications: { ...prev.notifications, ...(partial.notifications || {}) },
    }));
    const saved = await updateSettingsApi(partial);
    setSettings(saved);
    return saved;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
