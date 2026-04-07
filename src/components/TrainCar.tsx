'use client';

import type { SeatTemplate, SeatPosition } from '@/types';
import { SEAT_STATUS_COLORS } from '@/lib/constants';
import { SEAT_SIZE } from '@/data/seat-templates';

export type SeatStatus = 'empty' | 'available' | 'reserved' | 'mine' | 'priority';

interface TrainCarProps {
  template: SeatTemplate;
  /** 좌석별 상태 맵 (seat.id -> status) */
  seatStatuses?: Record<string, SeatStatus>;
  /** 선택된 좌석 ID */
  selectedSeatId?: string | null;
  /** 좌석 클릭 핸들러 */
  onSeatClick?: (seat: SeatPosition) => void;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 칸 번호 표시 */
  carNumber?: number;
}

export default function TrainCar({
  template,
  seatStatuses = {},
  selectedSeatId,
  onSeatClick,
  readOnly = false,
  carNumber,
}: TrainCarProps) {
  const { seats, doors, carWidth, carHeight } = template;

  function getSeatColor(seat: SeatPosition): string {
    if (selectedSeatId === seat.id) return SEAT_STATUS_COLORS.mine;
    const status = seatStatuses[seat.id];
    if (status) return SEAT_STATUS_COLORS[status];
    if (seat.type === 'priority') return SEAT_STATUS_COLORS.priority;
    return SEAT_STATUS_COLORS.empty;
  }

  function getSeatStroke(seat: SeatPosition): string {
    if (selectedSeatId === seat.id) return '#1D4ED8';
    const status = seatStatuses[seat.id];
    if (status === 'available') return '#059669';
    if (status === 'reserved') return '#D97706';
    return '#D1D5DB';
  }

  return (
    <div className="relative">
      {carNumber != null && (
        <div className="text-center text-xs text-gray-500 mb-1">{carNumber}호차</div>
      )}
      <svg
        viewBox={`0 0 ${carWidth} ${carHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '160px' }}
      >
        {/* 차량 외곽 */}
        <rect
          x={2}
          y={2}
          width={carWidth - 4}
          height={carHeight - 4}
          rx={12}
          ry={12}
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth={2}
        />

        {/* 문 */}
        {doors.map((door) => (
          <g key={door.id}>
            {/* 위쪽 문 */}
            <rect
              x={door.x}
              y={2}
              width={door.width}
              height={12}
              fill="#94A3B8"
              rx={2}
            />
            {/* 아래쪽 문 */}
            <rect
              x={door.x}
              y={carHeight - 14}
              width={door.width}
              height={12}
              fill="#94A3B8"
              rx={2}
            />
          </g>
        ))}

        {/* 중앙 통로 표시 */}
        <line
          x1={10}
          y1={carHeight / 2}
          x2={carWidth - 10}
          y2={carHeight / 2}
          stroke="#E2E8F0"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* 좌석 */}
        {seats.map((seat) => (
          <g
            key={seat.id}
            onClick={() => !readOnly && onSeatClick?.(seat)}
            className={!readOnly ? 'cursor-pointer' : ''}
            role={!readOnly ? 'button' : undefined}
            tabIndex={!readOnly ? 0 : undefined}
          >
            <rect
              x={seat.x}
              y={seat.y}
              width={SEAT_SIZE}
              height={SEAT_SIZE}
              rx={3}
              fill={getSeatColor(seat)}
              stroke={getSeatStroke(seat)}
              strokeWidth={selectedSeatId === seat.id ? 2 : 1}
            />
            {/* 좌석 상태 아이콘 */}
            {seatStatuses[seat.id] === 'available' && (
              <circle
                cx={seat.x + SEAT_SIZE / 2}
                cy={seat.y + SEAT_SIZE / 2}
                r={3}
                fill="white"
              />
            )}
            {seatStatuses[seat.id] === 'reserved' && (
              <text
                x={seat.x + SEAT_SIZE / 2}
                y={seat.y + SEAT_SIZE / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill="white"
                fontWeight="bold"
              >
                !
              </text>
            )}
          </g>
        ))}

        {/* 방향 표시 화살표 */}
        <text
          x={carWidth / 2}
          y={carHeight / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="#94A3B8"
        >
          ← 진행방향
        </text>
      </svg>
    </div>
  );
}
