'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ArrivalInfo, LineNumber } from '@/types';
import { getArrivals } from '@/lib/subway-api';
import { SEOUL_API_LINE_CODES } from '@/lib/constants';

interface UseArrivalInfoOptions {
  stationName: string | null;
  lineNumber?: LineNumber | null;
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
  lineNumber,
  pollInterval = 30000,
}: UseArrivalInfoOptions): UseArrivalInfoResult {
  const [arrivals, setArrivals] = useState<ArrivalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineCode = lineNumber ? SEOUL_API_LINE_CODES[lineNumber] : null;

  const fetchData = useCallback(async () => {
    if (!stationName) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getArrivals(stationName);
      const filtered = lineCode
        ? data.filter((a) => a.subwayId === lineCode)
        : data;
      setArrivals(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : '도착정보를 가져올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [stationName, lineCode]);

  useEffect(() => {
    fetchData();

    if (!stationName) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval, stationName]);

  return { arrivals, loading, error, refresh: fetchData };
}
