'use client';

import type { ArrivalInfo as ArrivalInfoType } from '@/types';
import { LINE_COLORS } from '@/lib/constants';

interface ArrivalInfoProps {
  arrivals: ArrivalInfoType[];
  loading: boolean;
  error: string | null;
  onSelect?: (arrival: ArrivalInfoType) => void;
  selectedTrainNo?: string | null;
}

export default function ArrivalInfo({
  arrivals,
  loading,
  error,
  onSelect,
  selectedTrainNo,
}: ArrivalInfoProps) {
  if (loading && arrivals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-gray-400 mt-2">도착정보 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (arrivals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">현재 도착 예정 열차가 없습니다</p>
      </div>
    );
  }

  // 방향별 그룹핑
  const upTrains = arrivals.filter((a) => a.updnLine === 'up');
  const downTrains = arrivals.filter((a) => a.updnLine === 'down');

  return (
    <div className="space-y-4">
      {upTrains.length > 0 && (
        <TrainGroup
          title="상행/외선"
          trains={upTrains}
          onSelect={onSelect}
          selectedTrainNo={selectedTrainNo}
        />
      )}
      {downTrains.length > 0 && (
        <TrainGroup
          title="하행/내선"
          trains={downTrains}
          onSelect={onSelect}
          selectedTrainNo={selectedTrainNo}
        />
      )}
    </div>
  );
}

function TrainGroup({
  title,
  trains,
  onSelect,
  selectedTrainNo,
}: {
  title: string;
  trains: ArrivalInfoType[];
  onSelect?: (arrival: ArrivalInfoType) => void;
  selectedTrainNo?: string | null;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{title}</h3>
      <div className="space-y-2">
        {trains.map((train, i) => {
          const isSelected = selectedTrainNo && train.btrainNo === selectedTrainNo;
          const lineNum = parseInt(train.subwayId.slice(-1)) || 2;

          return (
            <button
              key={`${train.ordkey}-${i}`}
              onClick={() => onSelect?.(train)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: LINE_COLORS[lineNum as keyof typeof LINE_COLORS] || '#6B7280' }}
              >
                {lineNum}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {train.bstatnNm}행
                </div>
                <div className="text-xs text-gray-500">
                  {train.btrainNo && `열차 ${train.btrainNo} · `}
                  {train.arvlMsg2}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-sm font-semibold ${
                  train.arvlMsg2.includes('도착') ? 'text-red-500' : 'text-blue-600'
                }`}>
                  {extractTime(train.arvlMsg2)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function extractTime(msg: string): string {
  if (msg.includes('도착')) return '도착';
  if (msg.includes('출발')) return '출발';
  const match = msg.match(/(\d+)분/);
  if (match) return `${match[1]}분`;
  return msg;
}
