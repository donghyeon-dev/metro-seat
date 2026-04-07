'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ArrivalInfo } from '@/types';
import { getArrivals } from '@/lib/subway-api';

interface UseArrivalInfoOptions {
  stationName: string | null;
  pollInterval?: number; // ms, 기본 30초
}

interface UseArrivalInfoResult {
  arrivals: ArrivalInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useArrivalInfo({
  stationName,
  pollInterval = 30000,
}: UseArrivalInfoOptions): UseArrivalInfoResult {
  const [arrivals, setArrivals] = useState<ArrivalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stationName) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getArrivals(stationName);
      setArrivals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '도착정보를 가져올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [stationName]);

  useEffect(() => {
    fetchData();

    if (!stationName) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval, stationName]);

  return { arrivals, loading, error, refresh: fetchData };
}
