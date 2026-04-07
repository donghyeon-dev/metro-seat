import { NextRequest, NextResponse } from 'next/server';
import { searchStations, getStationsByLine } from '@/data/stations';
import type { LineNumber } from '@/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || '';
  const lineParam = request.nextUrl.searchParams.get('line');
  const lineNumber = lineParam ? (parseInt(lineParam, 10) as LineNumber) : undefined;

  if (lineNumber && !query) {
    // 호선별 전체 역 목록
    const result = getStationsByLine(lineNumber);
    return NextResponse.json(result);
  }

  if (query) {
    const result = searchStations(query, lineNumber);
    return NextResponse.json(result);
  }

  return NextResponse.json([]);
}
