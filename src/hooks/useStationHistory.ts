'use client';

import { useCallback } from 'react';
import type { Station } from '@/types';
import { useLocalStorage } from './useLocalStorage';

const RECENT_KEY = 'metro-seat:recent-stations';
const FAVORITES_KEY = 'metro-seat:favorite-stations';
const MAX_RECENT = 10;
const EMPTY: Station[] = [];

export function useRecentStations() {
  const [recent, setRecent] = useLocalStorage<Station[]>(RECENT_KEY, EMPTY);

  const addRecent = useCallback(
    (station: Station) => {
      setRecent((prev) => {
        const filtered = prev.filter(
          (s) => !(s.code === station.code && s.lineNumber === station.lineNumber),
        );
        return [station, ...filtered].slice(0, MAX_RECENT);
      });
    },
    [setRecent],
  );

  return { recent, addRecent };
}

export function useFavoriteStations() {
  const [favorites, setFavorites] = useLocalStorage<Station[]>(FAVORITES_KEY, EMPTY);

  const toggleFavorite = useCallback(
    (station: Station) => {
      setFavorites((prev) => {
        const exists = prev.some(
          (s) => s.code === station.code && s.lineNumber === station.lineNumber,
        );
        return exists
          ? prev.filter(
              (s) => !(s.code === station.code && s.lineNumber === station.lineNumber),
            )
          : [...prev, station];
      });
    },
    [setFavorites],
  );

  const isFavorite = useCallback(
    (station: Station) =>
      favorites.some(
        (s) => s.code === station.code && s.lineNumber === station.lineNumber,
      ),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
