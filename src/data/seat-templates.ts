import type { SeatTemplate, SeatPosition, DoorPosition, LineNumber, CarType } from '@/types';

// 한국 지하철 칸 레이아웃
// 문 4개, 문 사이 구역(section) 3개 + 양 끝 2개 = 총 5구역
// 구형: 양쪽 벽면 각 7석 (우선석 포함), 신형: 양쪽 벽면 각 6석

const CAR_WIDTH = 500;
const CAR_HEIGHT = 130;
export const SEAT_SIZE = 12;
const SEAT_GAP = 2;
const SEAT_STEP = SEAT_SIZE + SEAT_GAP; // 14px per seat slot
const DOOR_WIDTH = 28;
const PAD = 8;

// 구역별 좌석 수: [끝, 중간, 중간, 중간, 끝]
const OLD_SECTIONS = [3, 7, 7, 7, 3]; // 구형: 54석 (양면)
const NEW_SECTIONS = [2, 6, 6, 6, 2]; // 신형: 44석 (양면)

// 구역 폭 계산
function sectionWidth(count: number): number {
  return count * SEAT_STEP - SEAT_GAP;
}

// 문 위치 계산 (구역 사이에 문 배치)
function computeDoors(sections: number[]): DoorPosition[] {
  let x = PAD + sectionWidth(sections[0]);
  const doors: DoorPosition[] = [];
  for (let i = 0; i < 4; i++) {
    doors.push({ id: `D${i + 1}`, x, y: 0, width: DOOR_WIDTH });
    if (i < 3) {
      x += DOOR_WIDTH + sectionWidth(sections[i + 1]);
    }
  }
  return doors;
}

// 좌석 생성
function generateSeats(sections: number[]): SeatPosition[] {
  const seats: SeatPosition[] = [];
  const yTop = 16;
  const yBottom = CAR_HEIGHT - 16 - SEAT_SIZE;

  let sectionStartX = PAD;

  for (let sec = 0; sec < sections.length; sec++) {
    const count = sections[sec];
    const isEnd = sec === 0 || sec === sections.length - 1;

    for (let i = 0; i < count; i++) {
      const x = sectionStartX + i * SEAT_STEP;
      // 양 끝 구역은 전체 우선석, 중간 구역은 양 끝 1석씩 우선석
      const isPriority = isEnd || i === 0 || i === count - 1;
      const seatType = isPriority ? 'priority' : 'normal';

      seats.push({
        id: `S${sec}-L${i + 1}`,
        section: sec,
        side: 'left',
        position: i + 1,
        type: seatType,
        x,
        y: yTop,
      });
      seats.push({
        id: `S${sec}-R${i + 1}`,
        section: sec,
        side: 'right',
        position: i + 1,
        type: seatType,
        x,
        y: yBottom,
      });
    }

    // 다음 구역 시작: 현재 구역 끝 + 문 폭
    sectionStartX += sectionWidth(count) + DOOR_WIDTH;
  }

  return seats;
}

const OLD_DOORS = computeDoors(OLD_SECTIONS);
const NEW_DOORS = computeDoors(NEW_SECTIONS);
const OLD_SEATS = generateSeats(OLD_SECTIONS);
const NEW_SEATS = generateSeats(NEW_SECTIONS);

function createTemplate(
  lineNumber: LineNumber,
  carType: CarType,
  description: string
): SeatTemplate {
  const isOld = carType === 'old';
  const seats = isOld ? OLD_SEATS : NEW_SEATS;
  const doors = isOld ? OLD_DOORS : NEW_DOORS;
  return {
    id: `line${lineNumber}-${carType}`,
    lineNumber,
    carType,
    description,
    totalSeatsPerCar: seats.length,
    seats,
    doors,
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

export function getTemplate(lineNumber: LineNumber, carType: CarType): SeatTemplate | undefined {
  return seatTemplates.find(
    (t) => t.lineNumber === lineNumber && t.carType === carType
  );
}

export function getTemplatesByLine(lineNumber: LineNumber): SeatTemplate[] {
  return seatTemplates.filter((t) => t.lineNumber === lineNumber);
}

export { CAR_WIDTH, CAR_HEIGHT };
