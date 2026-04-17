import type { SeatTemplate, SeatPosition, DoorPosition, LineNumber, CarType } from '@/types';

// 한국 지하철 칸 레이아웃 (세로형 — 위→아래)
// 좌·우 벽면 좌석이 각각 양쪽으로 길게 늘어선 구조.
// 진행방향은 아래(또는 위)로 표시되며, 문은 좌우 벽에 4개 × 2면 배치.
// 구역(section): [끝, 중간, 중간, 중간, 끝] = 5구역. 양 끝은 노약자석(우선석) 전용.
// 임산부석: 서울교통공사 2024.10 기준 "칸당 2석 — 중앙좌석(6~7인)의 양 끝 2자리"
// 즉 중간 3구역 중 가운데 구역에 좌·우 1석씩 총 2석.

const CAR_WIDTH = 160;
const CAR_HEIGHT = 620;
export const SEAT_SIZE = 14;
const SEAT_GAP = 2;
const SEAT_STEP = SEAT_SIZE + SEAT_GAP;
const DOOR_LENGTH = 34;
const PAD = 16;

const OLD_SECTIONS = [3, 7, 7, 7, 3]; // 구형: 54석
const NEW_SECTIONS = [2, 6, 6, 6, 2]; // 신형: 44석

function sectionLength(count: number): number {
  return count * SEAT_STEP - SEAT_GAP;
}

// 문은 구역 사이에 배치 (세로축).
function computeDoors(sections: number[]): DoorPosition[] {
  let y = PAD + sectionLength(sections[0]);
  const doors: DoorPosition[] = [];
  for (let i = 0; i < 4; i++) {
    doors.push({ id: `D${i + 1}`, x: 0, y, width: DOOR_LENGTH });
    if (i < 3) {
      y += DOOR_LENGTH + sectionLength(sections[i + 1]);
    }
  }
  return doors;
}

function generateSeats(sections: number[]): SeatPosition[] {
  const seats: SeatPosition[] = [];
  const xLeft = 18;
  const xRight = CAR_WIDTH - 18 - SEAT_SIZE;

  // 임산부석이 배치되는 "중앙 구역" = 중간 3구역 중 가운데 (인덱스 2)
  const pregnantSectionIndex = 2;

  let sectionStartY = PAD;

  for (let sec = 0; sec < sections.length; sec++) {
    const count = sections[sec];
    const isEnd = sec === 0 || sec === sections.length - 1;
    const isPregnantSection = sec === pregnantSectionIndex;

    for (let i = 0; i < count; i++) {
      const y = sectionStartY + i * SEAT_STEP;

      // 좌석 타입:
      // - 양 끝 구역(노약자석 전용)
      // - 중앙 구역의 양 끝 2자리 = 임산부 배려석 (서울교통공사 2024 기준)
      // - 그 외 = 일반석
      let seatType: SeatPosition['type'] = 'normal';
      if (isEnd) {
        seatType = 'priority';
      } else if (isPregnantSection && (i === 0 || i === count - 1)) {
        seatType = 'pregnant';
      }

      seats.push({
        id: `S${sec}-L${i + 1}`,
        section: sec,
        side: 'left',
        position: i + 1,
        type: seatType,
        x: xLeft,
        y,
      });
      seats.push({
        id: `S${sec}-R${i + 1}`,
        section: sec,
        side: 'right',
        position: i + 1,
        type: seatType,
        x: xRight,
        y,
      });
    }

    sectionStartY += sectionLength(count) + DOOR_LENGTH;
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
  createTemplate(9, 'old', '9호선 구형'),
  createTemplate(9, 'new', '9호선 신형'),
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
