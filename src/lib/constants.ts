import type { LineNumber } from '@/types';

// 호선별 색상
export const LINE_COLORS: Record<LineNumber, string> = {
  1: '#0052A4',  // 남색
  2: '#00A84D',  // 초록
  3: '#EF7C1C',  // 주황
  4: '#00A5DE',  // 하늘
  5: '#996CAC',  // 보라
  6: '#CD7C2F',  // 갈색
  7: '#747F00',  // 올리브
  8: '#E6186C',  // 분홍
  9: '#BDB092',  // 골드
};

// 호선별 이름
export const LINE_NAMES: Record<LineNumber, string> = {
  1: '1호선',
  2: '2호선',
  3: '3호선',
  4: '4호선',
  5: '5호선',
  6: '6호선',
  7: '7호선',
  8: '8호선',
  9: '9호선',
};

// 호선별 차량 편성 수
export const LINE_CAR_COUNT: Record<LineNumber, number> = {
  1: 10,
  2: 10,
  3: 10,
  4: 10,
  5: 8,
  6: 8,
  7: 8,
  8: 6,
  9: 4,
};

// 서울 열린데이터 API 호선 코드
export const SEOUL_API_LINE_CODES: Record<LineNumber, string> = {
  1: '1001',
  2: '1002',
  3: '1003',
  4: '1004',
  5: '1005',
  6: '1006',
  7: '1007',
  8: '1008',
  9: '1009',
};

// 좌석 상태별 색상
export const SEAT_STATUS_COLORS = {
  empty: '#E5E7EB',       // 회색 - 빈좌석 (등록 안됨)
  available: '#10B981',   // 초록 - 이용 가능
  reserved: '#F59E0B',    // 노랑 - 예약됨
  mine: '#3B82F6',        // 파랑 - 내 좌석
  priority: '#FCA5A5',    // 연빨강 - 우선석
  pregnant: '#F9A8D4',    // 연분홍 - 임산부석
} as const;

// 신고 사유 라벨
export const REPORT_REASON_LABELS: Record<string, string> = {
  no_show: '노쇼 (자리를 비우지 않음)',
  fake_offer: '허위 등록',
  harassment: '비매너 행위',
  other: '기타',
};
