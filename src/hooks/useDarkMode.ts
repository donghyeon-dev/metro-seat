'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(dark: boolean) {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      setIsDark(dark);
    }

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  }, []);

  return { theme, setTheme, isDark };
}
