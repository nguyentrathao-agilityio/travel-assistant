import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { darkShellColors, lightShellColors } from './shellTheme';

import type { ShellColors } from './shellTheme';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ShellColors;
}

const THEME_STORAGE_KEY = 'mobile-ui-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (!cancelled && isThemeMode(stored)) {
        setThemeState(stored);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const colors = theme === 'dark' ? darkShellColors : lightShellColors;

  const value = useMemo(() => ({ theme, setTheme, colors }), [theme, setTheme, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useShellTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useShellTheme must be used within a ThemeProvider');
  }

  return context;
};
