import type { ArrivalInfo, Direction } from '@/types';

// 서울 열린데이터 광장 실시간 지하철 도착정보 API
// API Docs: http://data.seoul.go.kr/dataList/OA-12764/F/1/datasetView.do
// Endpoint: http://swopenAPI.seoul.go.kr/api/subway/{KEY}/json/realtimeStationArrival/0/10/{역명}

const SEOUL_API_BASE = 'https://swopenAPI.seoul.go.kr/api/subway';

interface SeoulApiResponse {
  realtimeArrivalList?: SeoulArrivalItem[];
  errorMessage?: {
    status: number;
    code: string;
    message: string;
  };
}

interface SeoulArrivalItem {
  subwayId: string;
  statnNm: string;
  trainLineNm: string;
  bstatnNm: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
  updnLine: string;       // '상행' | '하행' | '외선' | '내선'
  btrainNo?: string;
  recptnDt: string;
  btrainSttus?: string;
  ordkey: string;
}

function mapDirection(updnLine: string): Direction {
  // 2호선은 '외선'(시계방향)/'내선'(반시계방향)
  if (updnLine === '상행' || updnLine === '외선') return 'up';
  return 'down';
}

export function parseArrivalInfo(item: SeoulArrivalItem): ArrivalInfo {
  return {
    subwayId: item.subwayId,
    statnNm: item.statnNm,
    trainLineNm: item.trainLineNm,
    bstatnNm: item.bstatnNm,
    arvlMsg2: item.arvlMsg2,
    arvlMsg3: item.arvlMsg3,
    arvlCd: item.arvlCd,
    updnLine: mapDirection(item.updnLine),
    btrainNo: item.btrainNo,
    recptnDt: item.recptnDt,
    btrainSttus: item.btrainSttus,
    ordkey: item.ordkey,
  };
}

// 서버 사이드에서 호출 (API Route에서 사용)
export async function fetchArrivals(stationName: string): Promise<ArrivalInfo[]> {
  const apiKey = process.env.SEOUL_API_KEY;
  if (!apiKey) {
    throw new Error('SEOUL_API_KEY is not configured');
  }

  const url = `${SEOUL_API_BASE}/${apiKey}/json/realtimeStationArrival/0/30/${encodeURIComponent(stationName)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: 30 },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('서울 지하철 API 응답 시간 초과');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`Seoul API returned ${res.status}`);
  }

  const data: SeoulApiResponse = await res.json();

  if (data.errorMessage) {
    const code = data.errorMessage.code;
    // INFO-000: 정상 처리 (성공) — 아래에서 realtimeArrivalList 처리
    if (code === 'INFO-000') {
      // fall through
    } else if (code === 'INFO-200') {
      // 데이터 없음 (심야 등)
      return [];
    } else {
      throw new Error(data.errorMessage.message);
    }
  }

  if (!data.realtimeArrivalList) {
    return [];
  }

  return data.realtimeArrivalList.map(parseArrivalInfo);
}

// 클라이언트에서 API 라우트를 통해 도착정보 가져오기
export async function getArrivals(stationName: string): Promise<ArrivalInfo[]> {
  const res = await fetch(`/api/subway/arrivals?station=${encodeURIComponent(stationName)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `서버 오류 (${res.status})`);
  }
  return res.json();
}
