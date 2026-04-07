'use client';

import type { CarType, LineNumber } from '@/types';
import { getTemplatesByLine } from '@/data/seat-templates';

interface CarTypeSelectorProps {
  lineNumber: LineNumber;
  selected: CarType | null;
  onSelect: (carType: CarType) => void;
}

export default function CarTypeSelector({
  lineNumber,
  selected,
  onSelect,
}: CarTypeSelectorProps) {
  const templates = getTemplatesByLine(lineNumber);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900">차량 타입 선택</h3>
      <p className="text-xs text-gray-500">
        탑승한 열차의 차량 타입을 선택해주세요
      </p>
      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.carType)}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              selected === template.carType
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900">
              {template.carType === 'old' ? '구형 차량' : '신형 차량'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {template.carType === 'old'
                ? '좁은 좌석, 문 사이 7석'
                : '넓은 좌석, 문 사이 6석'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              칸당 {template.totalSeatsPerCar}석
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
