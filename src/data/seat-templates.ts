import type { SeatTemplate, SeatPosition, DoorPosition, LineNumber, CarType } from '@/types';

// 지하철 칸 레이아웃 생성 헬퍼
// 한국 지하철 기준: 문 4개, 문 사이 구역(section) 3개 + 양 끝 2개 = 총 5구역
// 구형: 양쪽 각 7석씩 (우선석 포함), 신형: 양쪽 각 6석씩 (좌석 폭이 넓음)

const CAR_WIDTH = 360;
const CAR_HEIGHT = 120;
const DOOR_WIDTH = 30;
const SEAT_SIZE = 14;

// 문 위치 (4개)
const DOORS: DoorPosition[] = [
  { id: 'D1', x: 55, y: 0, width: DOOR_WIDTH },
  { id: 'D2', x: 127, y: 0, width: DOOR_WIDTH },
  { id: 'D3', x: 199, y: 0, width: DOOR_WIDTH },
  { id: 'D4', x: 271, y: 0, width: DOOR_WIDTH },
];

// 구형 차량 좌석 배치 생성
// 5구역: [문 왼쪽 끝] [문1-문2 사이] [문2-문3 사이] [문3-문4 사이] [문4 오른쪽 끝]
// 양쪽 끝 구역: 3석 (우선석)
// 중간 구역: 각 7석
function generateOldTypeSeats(): SeatPosition[] {
  const seats: SeatPosition[] = [];
  const yTop = 18;      // 윗줄 (left side)
  const yBottom = 88;   // 아랫줄 (right side)

  // Section 0: 왼쪽 끝 (문1 왼쪽) - 우선석 3개씩
  const sec0StartX = 10;
  for (let i = 0; i < 3; i++) {
    seats.push({
      id: `S0-L${i + 1}`,
      section: 0,
      side: 'left',
      position: i + 1,
      type: 'priority',
      x: sec0StartX + i * (SEAT_SIZE + 2),
      y: yTop,
    });
    seats.push({
      id: `S0-R${i + 1}`,
      section: 0,
      side: 'right',
      position: i + 1,
      type: 'priority',
      x: sec0StartX + i * (SEAT_SIZE + 2),
      y: yBottom,
    });
  }

  // Section 1~3: 문 사이 구역 - 각 7석씩
  const sectionStarts = [
    DOORS[0].x + DOOR_WIDTH + 6,  // 문1-문2 사이
    DOORS[1].x + DOOR_WIDTH + 6,  // 문2-문3 사이
    DOORS[2].x + DOOR_WIDTH + 6,  // 문3-문4 사이
  ];

  for (let sec = 0; sec < 3; sec++) {
    const startX = sectionStarts[sec];
    for (let i = 0; i < 7; i++) {
      const seatType = (i < 1 || i >= 6) ? 'priority' : 'normal';
      seats.push({
        id: `S${sec + 1}-L${i + 1}`,
        section: sec + 1,
        side: 'left',
        position: i + 1,
        type: seatType,
        x: startX + i * (SEAT_SIZE - 4),
        y: yTop,
      });
      seats.push({
        id: `S${sec + 1}-R${i + 1}`,
        section: sec + 1,
        side: 'right',
        position: i + 1,
        type: seatType,
        x: startX + i * (SEAT_SIZE - 4),
        y: yBottom,
      });
    }
  }

  // Section 4: 오른쪽 끝 (문4 오른쪽) - 우선석 3개씩
  const sec4StartX = DOORS[3].x + DOOR_WIDTH + 6;
  for (let i = 0; i < 3; i++) {
    seats.push({
      id: `S4-L${i + 1}`,
      section: 4,
      side: 'left',
      position: i + 1,
      type: 'priority',
      x: sec4StartX + i * (SEAT_SIZE + 2),
      y: yTop,
    });
    seats.push({
      id: `S4-R${i + 1}`,
      section: 4,
      side: 'right',
      position: i + 1,
      type: 'priority',
      x: sec4StartX + i * (SEAT_SIZE + 2),
      y: yBottom,
    });
  }

  return seats;
}

// 신형 차량: 좌석이 더 넓고 적음
function generateNewTypeSeats(): SeatPosition[] {
  const seats: SeatPosition[] = [];
  const yTop = 18;
  const yBottom = 88;

  // Section 0: 왼쪽 끝 - 우선석 2개씩
  const sec0StartX = 14;
  for (let i = 0; i < 2; i++) {
    seats.push({
      id: `S0-L${i + 1}`,
      section: 0,
      side: 'left',
      position: i + 1,
      type: 'priority',
      x: sec0StartX + i * (SEAT_SIZE + 4),
      y: yTop,
    });
    seats.push({
      id: `S0-R${i + 1}`,
      section: 0,
      side: 'right',
      position: i + 1,
      type: 'priority',
      x: sec0StartX + i * (SEAT_SIZE + 4),
      y: yBottom,
    });
  }

  // Section 1~3: 문 사이 구역 - 각 6석씩
  const sectionStarts = [
    DOORS[0].x + DOOR_WIDTH + 6,
    DOORS[1].x + DOOR_WIDTH + 6,
    DOORS[2].x + DOOR_WIDTH + 6,
  ];

  for (let sec = 0; sec < 3; sec++) {
    const startX = sectionStarts[sec];
    for (let i = 0; i < 6; i++) {
      const seatType = (i < 1 || i >= 5) ? 'priority' : 'normal';
      seats.push({
        id: `S${sec + 1}-L${i + 1}`,
        section: sec + 1,
        side: 'left',
        position: i + 1,
        type: seatType,
        x: startX + i * (SEAT_SIZE - 2),
        y: yTop,
      });
      seats.push({
        id: `S${sec + 1}-R${i + 1}`,
        section: sec + 1,
        side: 'right',
        position: i + 1,
        type: seatType,
        x: startX + i * (SEAT_SIZE - 2),
        y: yBottom,
      });
    }
  }

  // Section 4: 오른쪽 끝 - 우선석 2개씩
  const sec4StartX = DOORS[3].x + DOOR_WIDTH + 6;
  for (let i = 0; i < 2; i++) {
    seats.push({
      id: `S4-L${i + 1}`,
      section: 4,
      side: 'left',
      position: i + 1,
      type: 'priority',
      x: sec4StartX + i * (SEAT_SIZE + 4),
      y: yTop,
    });
    seats.push({
      id: `S4-R${i + 1}`,
      section: 4,
      side: 'right',
      position: i + 1,
      type: 'priority',
      x: sec4StartX + i * (SEAT_SIZE + 4),
      y: yBottom,
    });
  }

  return seats;
}

// 호선별 템플릿 생성
function createTemplate(
  lineNumber: LineNumber,
  carType: CarType,
  description: string
): SeatTemplate {
  const seats = carType === 'old' ? generateOldTypeSeats() : generateNewTypeSeats();
  return {
    id: `line${lineNumber}-${carType}`,
    lineNumber,
    carType,
    description,
    totalSeatsPerCar: seats.length,
    seats,
    doors: DOORS,
    carWidth: CAR_WIDTH,
    carHeight: CAR_HEIGHT,
  };
}

// 모든 템플릿
export const seatTemplates: SeatTemplate[] = [
  createTemplate(1, 'old', '1호선 구형'),
  createTemplate(1, 'new', '1호선 신형'),
  createTemplate(2, 'old', '2호선 구형'),
  createTemplate(2, 'new', '2호선 신형'),
  createTemplate(3, 'old', '3호선 구형'),
  createTemplate(3, 'new', '3호선 신형'),
  createTemplate(4, 'old', '4호선 구형'),
  createTemplate(4, 'new', '4호선 신형'),
  createTemplate(5, 'old', '5호선 구형'),
  createTemplate(5, 'new', '5호선 신형'),
  createTemplate(6, 'old', '6호선 구형'),
  createTemplate(6, 'new', '6호선 신형'),
  createTemplate(7, 'old', '7호선 구형'),
  createTemplate(7, 'new', '7호선 신형'),
  createTemplate(8, 'old', '8호선 구형'),
  createTemplate(8, 'new', '8호선 신형'),
];

// 호선 + 타입으로 템플릿 찾기
export function getTemplate(lineNumber: LineNumber, carType: CarType): SeatTemplate | undefined {
  return seatTemplates.find(
    (t) => t.lineNumber === lineNumber && t.carType === carType
  );
}

// 호선별 템플릿 목록
export function getTemplatesByLine(lineNumber: LineNumber): SeatTemplate[] {
  return seatTemplates.filter((t) => t.lineNumber === lineNumber);
}

export { CAR_WIDTH, CAR_HEIGHT, SEAT_SIZE };
