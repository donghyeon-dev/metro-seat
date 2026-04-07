'use client';

import { useState } from 'react';
import StationSelector from '@/components/StationSelector';
import ArrivalInfo from '@/components/ArrivalInfo';
import SeatMap from '@/components/SeatMap';
import CarTypeSelector from '@/components/CarTypeSelector';
import { useArrivalInfo } from '@/hooks/useArrivalInfo';
import type { Station, ArrivalInfo as ArrivalInfoType, LineNumber, CarType, SeatPosition } from '@/types';
import { type SeatStatus } from '@/components/TrainCar';

type Step = 'route' | 'arrivals' | 'seats';

export default function SeekPage() {
  const [step, setStep] = useState<Step>('route');
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<ArrivalInfoType | null>(null);
  const [carType, setCarType] = useState<CarType | null>(null);
  const [requestedSeat, setRequestedSeat] = useState<{ car: number; seat: SeatPosition } | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const { arrivals, loading, error, refresh } = useArrivalInfo({
    stationName: step === 'arrivals' ? fromStation?.name ?? null : null,
  });

  // Mock: 임시 좌석 상태 (실제로는 Supabase에서 가져옴)
  const mockSeatStatuses: Record<number, Record<string, SeatStatus>> = {
    3: { 'S1-L3': 'available', 'S2-R5': 'available' },
    5: { 'S0-L2': 'available', 'S3-L4': 'available', 'S3-R2': 'reserved' },
    7: { 'S2-L1': 'available' },
  };

  const lineNumber = fromStation?.lineNumber as LineNumber | undefined;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-gray-900 mb-1">자리 찾기</h1>
      <p className="text-sm text-gray-500 mb-6">빈자리를 미리 확인하세요</p>

      {/* Step 1: 출발/도착역 입력 */}
      {step === 'route' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">출발역</label>
            <StationSelector
              placeholder="출발역을 검색하세요"
              value={fromStation}
              onChange={setFromStation}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">도착역</label>
            <StationSelector
              placeholder="도착역을 검색하세요"
              value={toStation}
              onChange={setToStation}
            />
          </div>

          <button
            disabled={!fromStation || !toStation}
            onClick={() => setStep('arrivals')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:text-gray-500 active:bg-blue-700 transition-colors"
          >
            열차 검색
          </button>
        </div>
      )}

      {/* Step 2: 실시간 도착정보에서 열차 선택 */}
      {step === 'arrivals' && fromStation && (
        <div>
          <button
            onClick={() => setStep('route')}
            className="flex items-center gap-1 text-sm text-gray-500 mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            경로 수정
          </button>

          <div className="bg-white rounded-xl p-3 mb-4 border border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900">{fromStation.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="font-medium text-gray-900">{toStation?.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">도착 예정 열차</h2>
            <button
              onClick={refresh}
              className="text-xs text-blue-600 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              새로고침
            </button>
          </div>

          <ArrivalInfo
            arrivals={arrivals}
            loading={loading}
            error={error}
            onSelect={(arrival) => {
              setSelectedTrain(arrival);
              setStep('seats');
            }}
            selectedTrainNo={selectedTrain?.btrainNo}
          />
        </div>
      )}

      {/* Step 3: 좌석 현황 */}
      {step === 'seats' && selectedTrain && lineNumber && (
        <div>
          <button
            onClick={() => {
              setStep('arrivals');
              setCarType(null);
              setRequestedSeat(null);
              setRequestSent(false);
            }}
            className="flex items-center gap-1 text-sm text-gray-500 mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            열차 목록
          </button>

          <div className="bg-white rounded-xl p-3 mb-4 border border-gray-100">
            <div className="text-sm font-medium text-gray-900">
              {selectedTrain.bstatnNm}행 · {selectedTrain.arvlMsg2}
            </div>
            {selectedTrain.btrainNo && (
              <div className="text-xs text-gray-500 mt-1">열차번호: {selectedTrain.btrainNo}</div>
            )}
          </div>

          {/* 차량 타입 선택 */}
          {!carType ? (
            <CarTypeSelector
              lineNumber={lineNumber}
              selected={carType}
              onSelect={setCarType}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">좌석 현황</h2>
                <button
                  onClick={() => setCarType(null)}
                  className="text-xs text-gray-500 underline"
                >
                  차량 타입 변경
                </button>
              </div>

              <SeatMap
                lineNumber={lineNumber}
                carType={carType}
                carSeatStatuses={mockSeatStatuses}
                onSeatSelect={(carNum, seat) => {
                  const status = mockSeatStatuses[carNum]?.[seat.id];
                  if (status === 'available') {
                    setRequestedSeat({ car: carNum, seat });
                  }
                }}
                selectedSeatId={requestedSeat?.seat.id}
              />

              {/* 좌석 요청 */}
              {requestedSeat && !requestSent && (
                <div className="mt-4 bg-green-50 rounded-2xl p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    {requestedSeat.car}호차 {requestedSeat.seat.id} 좌석을 요청할까요?
                  </p>
                  <p className="text-xs text-green-700 mb-3">
                    해당 좌석 앞으로 이동한 후 요청해주세요
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRequestedSeat(null)}
                      className="flex-1 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Supabase에 seat_request 생성
                        setRequestSent(true);
                      }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold active:bg-green-700"
                    >
                      좌석 요청
                    </button>
                  </div>
                </div>
              )}

              {requestSent && (
                <div className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full" />
                    <p className="text-sm font-medium text-blue-900">요청을 보냈습니다</p>
                  </div>
                  <p className="text-xs text-blue-700">
                    제공자의 확인을 기다리고 있습니다. 해당 좌석 앞에서 대기해주세요.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
