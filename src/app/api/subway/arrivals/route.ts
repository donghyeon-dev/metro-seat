import { NextRequest, NextResponse } from 'next/server';
import { parseArrivalInfo } from '@/lib/subway-api';
import type { ArrivalInfo } from '@/types';

// Edge Runtime: 한국 CDN 엣지에서 실행되어 서울시 API 접근 가능
export const runtime = 'edge';
export const preferredRegion = ['icn1', 'hnd1'];

const SEOUL_API_BASE = 'http://swopenAPI.seoul.go.kr/api/subway';

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

  const url = `${SEOUL_API_BASE}/${apiKey}/json/realtimeStationArrival/0/30/${encodeURIComponent(station)}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Seoul API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.errorMessage) {
      if (data.errorMessage.code === 'INFO-200') {
        return NextResponse.json([], {
          headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }
      return NextResponse.json(
        { error: data.errorMessage.message },
        { status: 502 }
      );
    }

    const arrivals: ArrivalInfo[] = (data.realtimeArrivalList ?? []).map(parseArrivalInfo);

    return NextResponse.json(arrivals, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[subway/arrivals] Error:', message);

    return NextResponse.json(
      { error: `서울 지하철 API 연결 실패: ${message}` },
      { status: 502 }
    );
  }
}
