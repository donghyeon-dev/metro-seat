'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ArrivalInfo, LineNumber } from '@/types';
import { getArrivals } from '@/lib/subway-api';
import { SEOUL_API_LINE_CODES } from '@/lib/constants';

interface UseArrivalInfoOptions {
  stationName: string | null;
  lineNumber?: LineNumber | null;
  pollInterval?: number; // ms, 기본 30초
  trainNumber?: string | null; // 열차번호 직접 매칭
}

interface UseArrivalInfoResult {
  arrivals: ArrivalInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** 열차번호로 exact match된 열차 */
  matchedTrain: ArrivalInfo | null;
}

export function useArrivalInfo({
  stationName,
  lineNumber,
  pollInterval = 30000,
  trainNumber,
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

      // 호선 필터링
      let filtered = lineCode
        ? data.filter((a) => a.subwayId === lineCode)
        : data;

      // 도착시간 기반 정렬 (가까운 순서)
      filtered = sortByArrivalTime(filtered);

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

  // 열차번호 exact match
  const matchedTrain = trainNumber
    ? arrivals.find((a) => a.btrainNo === trainNumber) ?? null
    : null;

  return { arrivals, loading, error, refresh: fetchData, matchedTrain };
}

// 도착시간 기반 정렬 (도착/출발 > N분 후 > 기타)
function sortByArrivalTime(arrivals: ArrivalInfo[]): ArrivalInfo[] {
  return [...arrivals].sort((a, b) => {
    const timeA = parseArrivalMinutes(a.arvlMsg2);
    const timeB = parseArrivalMinutes(b.arvlMsg2);
    return timeA - timeB;
  });
}

function parseArrivalMinutes(msg: string): number {
  if (msg.includes('도착') || msg.includes('진입')) return 0;
  if (msg.includes('출발')) return 0.5;
  const match = msg.match(/(\d+)분/);
  if (match) return parseInt(match[1]);
  // 'N번째 전역' 패턴
  const stationMatch = msg.match(/(\d+)번째/);
  if (stationMatch) return parseInt(stationMatch[1]) * 2; // 역간 약 2분
  return 99; // 알 수 없음
}
