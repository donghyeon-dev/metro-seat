'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useLocalStorage } from './useLocalStorage';

type Theme = 'light' | 'dark' | 'system';

function subscribePrefers(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerPrefersDark() {
  return false;
}

export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');
  const prefersDark = useSyncExternalStore(
    subscribePrefers,
    getPrefersDark,
    getServerPrefersDark,
  );

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const next = theme === 'system' ? prefersDark : theme === 'dark';
    const root = document.documentElement;
    if (next) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDark((cur) => (cur === next ? cur : next));
  }, [theme, prefersDark]);

  const setThemeMemo = useCallback(
    (t: Theme) => {
      setTheme(t);
    },
    [setTheme],
  );

  return { theme, setTheme: setThemeMemo, isDark };
}
