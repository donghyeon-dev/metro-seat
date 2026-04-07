import { NextRequest, NextResponse } from 'next/server';
import { fetchArrivals } from '@/lib/subway-api';

// Vercel 서버리스 함수를 한국/일본 리전에서 실행 (서울시 API 접근용)
export const runtime = 'nodejs';
export const preferredRegion = ['icn1', 'hnd1'];

export async function GET(request: NextRequest) {
  const station = request.nextUrl.searchParams.get('station');

  if (!station) {
    return NextResponse.json(
      { error: '역명을 입력해주세요' },
      { status: 400 }
    );
  }

  try {
    const arrivals = await fetchArrivals(station);
    return NextResponse.json(arrivals, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
