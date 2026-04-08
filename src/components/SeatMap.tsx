'use client';

import { useState } from 'react';
import TrainCar, { type SeatStatus } from './TrainCar';
import type { SeatTemplate, SeatPosition, LineNumber, CarType } from '@/types';
import { getTemplate } from '@/data/seat-templates';
import { LINE_COLORS } from '@/lib/constants';

interface SeatMapProps {
  lineNumber: LineNumber;
  carType: CarType;
  /** 총 칸 수 */
  totalCars?: number;
  /** 칸별 좌석 상태 { carNumber: { seatId: status } } */
  carSeatStatuses?: Record<number, Record<string, SeatStatus>>;
  /** 좌석 선택 핸들러 */
  onSeatSelect?: (carNumber: number, seat: SeatPosition) => void;
  /** 호차 변경 핸들러 */
  onCarChange?: (carNumber: number) => void;
  /** 선택된 칸 번호 */
  selectedCar?: number | null;
  /** 선택된 좌석 ID */
  selectedSeatId?: string | null;
  /** 읽기 전용 */
  readOnly?: boolean;
}

export default function SeatMap({
  lineNumber,
  carType,
  totalCars = 10,
  carSeatStatuses = {},
  onSeatSelect,
  onCarChange,
  selectedCar: controlledCar,
  selectedSeatId,
  readOnly = false,
}: SeatMapProps) {
  const [internalCar, setInternalCar] = useState(1);
  const selectedCar = controlledCar ?? internalCar;
  const template = getTemplate(lineNumber, carType);

  if (!template) {
    return <div className="text-center text-gray-400 py-8">템플릿을 찾을 수 없습니다</div>;
  }

  const lineColor = LINE_COLORS[lineNumber];

  return (
    <div>
      {/* 칸 선택 바 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">호차 선택</span>
          <span className="text-xs text-gray-400">← 스크롤 →</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: totalCars }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedCar === num;
            const hasAvailable = Object.values(carSeatStatuses[num] ?? {}).some(
              (s) => s === 'available'
            );
            return (
              <button
                key={num}
                onClick={() => {
                  setInternalCar(num);
                  onCarChange?.(num);
                }}
                className={`flex-shrink-0 w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? 'text-white shadow-md scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={isSelected ? { backgroundColor: lineColor } : undefined}
              >
                {num}
                {hasAvailable && !isSelected && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-green-500 mx-auto -mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 열차 시각화 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <TrainCar
          template={template}
          seatStatuses={carSeatStatuses[selectedCar] ?? {}}
          selectedSeatId={selectedCar === (controlledCar ?? internalCar) ? selectedSeatId : null}
          onSeatClick={(seat) => onSeatSelect?.(selectedCar, seat)}
          readOnly={readOnly}
          carNumber={selectedCar}
        />

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Legend color="#E5E7EB" label="빈좌석" />
          <Legend color="#10B981" label="이용가능" />
          <Legend color="#F59E0B" label="예약됨" />
          <Legend color="#3B82F6" label="내 좌석" />
          <Legend color="#FCA5A5" label="우선석" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded-sm border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
