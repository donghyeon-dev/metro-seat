'use client';

import { useState, useRef } from 'react';
import TrainCar, { type SeatStatus } from './TrainCar';
import type { SeatTemplate, SeatPosition, LineNumber, CarType } from '@/types';
import { getTemplate } from '@/data/seat-templates';
import { LINE_COLORS, LINE_CAR_COUNT } from '@/lib/constants';

interface SeatMapProps {
  lineNumber: LineNumber;
  carType: CarType;
  totalCars?: number;
  carSeatStatuses?: Record<number, Record<string, SeatStatus>>;
  onSeatSelect?: (carNumber: number, seat: SeatPosition) => void;
  onCarChange?: (carNumber: number) => void;
  selectedCar?: number | null;
  selectedSeatId?: string | null;
  readOnly?: boolean;
}

export default function SeatMap({
  lineNumber,
  carType,
  totalCars: totalCarsProp,
  carSeatStatuses = {},
  onSeatSelect,
  onCarChange,
  selectedCar: controlledCar,
  selectedSeatId,
  readOnly = false,
}: SeatMapProps) {
  const [internalCar, setInternalCar] = useState(1);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCar = controlledCar ?? internalCar;
  const template = getTemplate(lineNumber, carType);
  const totalCars = totalCarsProp ?? LINE_CAR_COUNT[lineNumber] ?? 10;

  if (!template) {
    return <div className="text-center text-gray-400 py-8">템플릿을 찾을 수 없습니다</div>;
  }

  const lineColor = LINE_COLORS[lineNumber];

  return (
    <div>
      {/* 칸 선택 바 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">호차 선택</span>
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
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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

      {/* 열차 시각화 (확대 가능) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* 줌 컨트롤 */}
        <div className="flex items-center justify-end gap-2 mb-2">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            disabled={zoom <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-30"
          >
            −
          </button>
          <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            disabled={zoom >= 3}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm disabled:opacity-30"
          >
            +
          </button>
        </div>

        <div
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: zoom > 1 ? `${100 * zoom}%` : '100%',
            }}
          >
            <TrainCar
              template={template}
              seatStatuses={carSeatStatuses[selectedCar] ?? {}}
              selectedSeatId={selectedCar === (controlledCar ?? internalCar) ? selectedSeatId : null}
              onSeatClick={(seat) => onSeatSelect?.(selectedCar, seat)}
              readOnly={readOnly}
              carNumber={selectedCar}
            />
          </div>
        </div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          <Legend color="#E5E7EB" label="빈좌석" />
          <Legend color="#10B981" label="이용가능" />
          <Legend color="#F59E0B" label="예약됨" />
          <Legend color="#3B82F6" label="내 좌석" />
          <Legend color="#FCA5A5" label="우선석" />
          <Legend color="#F9A8D4" label="임산부석" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
}
