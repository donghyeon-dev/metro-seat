import { NextRequest, NextResponse } from 'next/server';
import { fetchArrivals } from '@/lib/subway-api';

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

    // API 키 미설정 시 mock 데이터 반환 (개발용)
    if (message.includes('SEOUL_API_KEY')) {
      return NextResponse.json(getMockArrivals(station));
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// 개발용 Mock 데이터
function getMockArrivals(stationName: string) {
  const now = new Date();
  const mockTrains = [
    { dest: '신도림', dir: 'up' as const, min: 2, trainNo: '2315' },
    { dest: '성수', dir: 'down' as const, min: 5, trainNo: '2042' },
    { dest: '까치산', dir: 'up' as const, min: 8, trainNo: '2117' },
    { dest: '잠실', dir: 'down' as const, min: 12, trainNo: '2244' },
  ];

  return mockTrains.map((t, i) => ({
    subwayId: '1002',
    statnNm: stationName,
    trainLineNm: `${t.dest}행 - ${stationName}`,
    bstatnNm: t.dest,
    arvlMsg2: `${t.min}분 후 도착`,
    arvlMsg3: `전역 출발`,
    arvlCd: '1',
    updnLine: t.dir,
    btrainNo: t.trainNo,
    recptnDt: now.toISOString(),
    btrainSttus: '0',
    ordkey: `0${i}`,
  }));
}
