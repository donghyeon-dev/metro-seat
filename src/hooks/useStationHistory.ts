'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Station } from '@/types';

const RECENT_KEY = 'metro-seat:recent-stations';
const FAVORITES_KEY = 'metro-seat:favorite-stations';
const MAX_RECENT = 10;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function useRecentStations() {
  const [recent, setRecent] = useState<Station[]>([]);

  useEffect(() => {
    setRecent(loadFromStorage<Station[]>(RECENT_KEY, []));
  }, []);

  const addRecent = useCallback((station: Station) => {
    setRecent((prev) => {
      const filtered = prev.filter(
        (s) => !(s.code === station.code && s.lineNumber === station.lineNumber)
      );
      const next = [station, ...filtered].slice(0, MAX_RECENT);
      saveToStorage(RECENT_KEY, next);
      return next;
    });
  }, []);

  return { recent, addRecent };
}

export function useFavoriteStations() {
  const [favorites, setFavorites] = useState<Station[]>([]);

  useEffect(() => {
    setFavorites(loadFromStorage<Station[]>(FAVORITES_KEY, []));
  }, []);

  const toggleFavorite = useCallback((station: Station) => {
    setFavorites((prev) => {
      const exists = prev.some(
        (s) => s.code === station.code && s.lineNumber === station.lineNumber
      );
      const next = exists
        ? prev.filter((s) => !(s.code === station.code && s.lineNumber === station.lineNumber))
        : [...prev, station];
      saveToStorage(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (station: Station) =>
      favorites.some(
        (s) => s.code === station.code && s.lineNumber === station.lineNumber
      ),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
