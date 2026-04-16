import { NextRequest, NextResponse } from 'next/server';
import { parseArrivalInfo } from '@/lib/subway-api';
import type { ArrivalInfo } from '@/types';

export const dynamic = 'force-dynamic';

const SEOUL_API_BASE = 'http://swopenAPI.seoul.go.kr/api/subway';

// 간단한 인메모리 캐시 (API rate limit 대응)
const cache = new Map<string, { data: ArrivalInfo[]; timestamp: number }>();
const CACHE_TTL = 15_000; // 15초

export async function GET(request: NextRequest) {
  const station = request.nextUrl.searchParams.get('station');

  if (!station) {
    return NextResponse.json(
      { error: '역명을 입력해주세요' },
      { status: 400 }
    );
  }

  const apiKey = process.env.SEOUL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'SEOUL_API_KEY가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  // 캐시 확인
  const cacheKey = station;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        'X-Cache': 'HIT',
      },
    });
  }

  const url = `${SEOUL_API_BASE}/${apiKey}/json/realtimeStationArrival/0/30/${encodeURIComponent(station)}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // 서울 API 서버 에러 시 캐시된 데이터라도 반환
      if (cached) {
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': 'public, s-maxage=10',
            'X-Cache': 'STALE',
          },
        });
      }
      return NextResponse.json(
        { error: `서울 지하철 API 서버 오류 (${res.status}). 잠시 후 다시 시도해주세요.` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.errorMessage) {
      const code = data.errorMessage.code;
      if (code === 'INFO-000') {
        // 성공 — 아래에서 realtimeArrivalList 처리
      } else if (code === 'INFO-200') {
        // 데이터 없음 (심야시간 등)
        const now = new Date();
        const hour = now.getHours();
        const isNightTime = hour >= 0 && hour < 5;
        const message = isNightTime
          ? '심야시간(00:00~05:00)에는 열차 운행이 없습니다'
          : '현재 도착 예정 열차가 없습니다';

        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'X-Night-Info': isNightTime ? 'true' : 'false',
            'X-Empty-Reason': message,
          },
        });
      } else {
        return NextResponse.json(
          { error: data.errorMessage.message || '서울 API 오류가 발생했습니다' },
          { status: 502 }
        );
      }
    }

    const arrivals: ArrivalInfo[] = (data.realtimeArrivalList ?? []).map(parseArrivalInfo);

    // 캐시 저장
    cache.set(cacheKey, { data: arrivals, timestamp: Date.now() });

    // 오래된 캐시 정리 (100개 초과 시)
    if (cache.size > 100) {
      const cutoff = Date.now() - CACHE_TTL * 4;
      for (const [key, val] of cache) {
        if (val.timestamp < cutoff) cache.delete(key);
      }
    }

    return NextResponse.json(arrivals, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // 네트워크/타임아웃 에러 시 캐시된 데이터 반환
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=10',
          'X-Cache': 'STALE',
        },
      });
    }

    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    const message = isTimeout
      ? '서울 지하철 API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
      : '서울 지하철 API에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';

    console.error('[subway/arrivals] Error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
