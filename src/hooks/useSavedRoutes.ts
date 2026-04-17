'use client';

import { useCallback } from 'react';
import type { Station } from '@/types';
import { useLocalStorage } from './useLocalStorage';

export interface SavedRoute {
  id: string;
  from: Station;
  to: Station;
  label?: string;
  usedAt: number;
}

const STORAGE_KEY = 'metro-seat:saved-routes';
const MAX_ROUTES = 5;
const EMPTY: SavedRoute[] = [];

export function useSavedRoutes() {
  const [routes, setRoutes] = useLocalStorage<SavedRoute[]>(STORAGE_KEY, EMPTY);

  const save = useCallback(
    (from: Station, to: Station, label?: string) => {
      setRoutes((prev) => {
        const existing = prev.find(
          (r) =>
            r.from.code === from.code &&
            r.from.lineNumber === from.lineNumber &&
            r.to.code === to.code &&
            r.to.lineNumber === to.lineNumber,
        );
        if (existing) {
          return prev.map((r) =>
            r.id === existing.id
              ? { ...r, usedAt: Date.now(), label: label || r.label }
              : r,
          );
        }
        const newRoute: SavedRoute = {
          id: `${from.lineNumber}-${from.code}-${to.lineNumber}-${to.code}`,
          from,
          to,
          label,
          usedAt: Date.now(),
        };
        return [newRoute, ...prev].slice(0, MAX_ROUTES);
      });
    },
    [setRoutes],
  );

  const remove = useCallback(
    (id: string) => {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    },
    [setRoutes],
  );

  return { routes, save, remove };
}
