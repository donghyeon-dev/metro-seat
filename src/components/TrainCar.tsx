'use client';

import type { SeatTemplate, SeatPosition } from '@/types';
import { SEAT_STATUS_COLORS } from '@/lib/constants';
import { SEAT_SIZE } from '@/data/seat-templates';

export type SeatStatus = 'empty' | 'available' | 'reserved' | 'mine' | 'priority';

interface TrainCarProps {
  template: SeatTemplate;
  seatStatuses?: Record<string, SeatStatus>;
  selectedSeatId?: string | null;
  onSeatClick?: (seat: SeatPosition) => void;
  readOnly?: boolean;
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
    if (seat.type === 'pregnant') return SEAT_STATUS_COLORS.pregnant;
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
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-1">{carNumber}호차</div>
      )}
      <svg
        viewBox={`0 0 ${carWidth} ${carHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '180px' }}
      >
        {/* 차량 외곽 */}
        <rect
          x={2}
          y={2}
          width={carWidth - 4}
          height={carHeight - 4}
          rx={14}
          ry={14}
          className="fill-[#F8FAFC] dark:fill-[#1F2937] stroke-[#CBD5E1] dark:stroke-[#4B5563]"
          strokeWidth={2}
        />

        {/* 문 (위/아래 양쪽) */}
        {doors.map((door) => (
          <g key={door.id}>
            <rect
              x={door.x}
              y={2}
              width={door.width}
              height={10}
              className="fill-[#94A3B8] dark:fill-[#6B7280]"
              rx={2}
            />
            <rect
              x={door.x}
              y={carHeight - 12}
              width={door.width}
              height={10}
              className="fill-[#94A3B8] dark:fill-[#6B7280]"
              rx={2}
            />
            <text
              x={door.x + door.width / 2}
              y={carHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7}
              className="fill-[#CBD5E1] dark:fill-[#6B7280]"
            >
              {door.id}
            </text>
          </g>
        ))}

        {/* 중앙 통로 */}
        <line
          x1={14}
          y1={carHeight / 2}
          x2={carWidth - 14}
          y2={carHeight / 2}
          className="stroke-[#E2E8F0] dark:stroke-[#374151]"
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* 좌석 */}
        {seats.map((seat) => {
          const isSelected = selectedSeatId === seat.id;
          return (
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
                rx={2}
                fill={getSeatColor(seat)}
                stroke={getSeatStroke(seat)}
                strokeWidth={isSelected ? 2 : 1}
              />
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
          );
        })}

        {/* 진행방향 */}
        <text
          x={carWidth / 2}
          y={carHeight / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          className="fill-[#94A3B8] dark:fill-[#6B7280]"
        >
          ← 진행방향
        </text>
      </svg>
    </div>
  );
}
