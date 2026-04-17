'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Station } from '@/types';

export interface SavedRoute {
  id: string;
  from: Station;
  to: Station;
  label?: string;
  usedAt: number;
}

const STORAGE_KEY = 'metro-seat:saved-routes';
const MAX_ROUTES = 5;

export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRoutes(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((from: Station, to: Station, label?: string) => {
    setRoutes(prev => {
      // 이미 같은 경로가 있으면 업데이트
      const existing = prev.find(
        r => r.from.code === from.code && r.from.lineNumber === from.lineNumber
          && r.to.code === to.code && r.to.lineNumber === to.lineNumber
      );
      let updated: SavedRoute[];
      if (existing) {
        updated = prev.map(r =>
          r.id === existing.id ? { ...r, usedAt: Date.now(), label: label || r.label } : r
        );
      } else {
        const newRoute: SavedRoute = {
          id: `${from.lineNumber}-${from.code}-${to.lineNumber}-${to.code}`,
          from,
          to,
          label,
          usedAt: Date.now(),
        };
        updated = [newRoute, ...prev].slice(0, MAX_ROUTES);
      }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setRoutes(prev => {
      const updated = prev.filter(r => r.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  return { routes, save, remove };
}
