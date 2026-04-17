'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StationSelector from '@/components/StationSelector';
import ArrivalInfo from '@/components/ArrivalInfo';
import SeatMap from '@/components/SeatMap';
import CarTypeSelector from '@/components/CarTypeSelector';
import { SkeletonArrivalList } from '@/components/Skeleton';
import { useAuth } from '@/components/AuthProvider';
import { useArrivalInfo } from '@/hooks/useArrivalInfo';
import { useRealtimeOffers } from '@/hooks/useRealtimeOffers';
import { useRecentStations } from '@/hooks/useStationHistory';
import { useSavedRoutes } from '@/hooks/useSavedRoutes';
import { createClient } from '@/lib/supabase/client';
import { ensureProfileExists } from '@/lib/supabase/ensure-profile';
import type { Station, ArrivalInfo as ArrivalInfoType, LineNumber, CarType, SeatPosition } from '@/types';
import { type SeatStatus } from '@/components/TrainCar';

type Step = 'route' | 'arrivals' | 'seats';

export default function SeekPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('route');
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<ArrivalInfoType | null>(null);
  const [carType, setCarType] = useState<CarType | null>(null);
  const [requestedSeat, setRequestedSeat] = useState<{ car: number; seat: SeatPosition } | null>(null);
  const [requestingOffer, setRequestingOffer] = useState(false);

  const { recent, addRecent } = useRecentStations();
  const { routes: savedRoutes, save: saveRoute, remove: removeRoute } = useSavedRoutes();

  const { arrivals, loading, error, refresh } = useArrivalInfo({
    stationName: step === 'arrivals' ? fromStation?.name ?? null : null,
    lineNumber: fromStation?.lineNumber,
  });

  const lineNumber = fromStation?.lineNumber as LineNumber | undefined;

  const { offers } = useRealtimeOffers({
    lineNumber,
    direction: selectedTrain?.updnLine,
    trainDestination: selectedTrain?.bstatnNm,
    enabled: step === 'seats' && !!selectedTrain && !!lineNumber,
  });

  const seatStatuses: Record<number, Record<string, SeatStatus>> = {};
  for (const offer of offers) {
    if (!seatStatuses[offer.car_number]) {
      seatStatuses[offer.car_number] = {};
    }
    seatStatuses[offer.car_number][offer.seat_id] = offer.status === 'available' ? 'available' : 'reserved';
  }

  function findOffer(carNum: number, seatId: string) {
    return offers.find((o) => o.car_number === carNum && o.seat_id === seatId);
  }

  async function handleRequest() {
    if (!user || !requestedSeat) return;
    setRequestingOffer(true);
    try {
      const supabase = createClient();
      await ensureProfileExists(supabase, user);

      const offer = findOffer(requestedSeat.car, requestedSeat.seat.id);
      if (!offer) return;

      const { data: request, error: insertError } = await supabase.from('seat_requests').insert({
        offer_id: offer.id,
        seeker_id: user.id,
        status: 'pending',
      }).select('id').single();

      if (insertError) throw insertError;
      if (navigator.vibrate) navigator.vibrate(200);

      // 라이브 세션 화면으로 이동
      router.push(`/session/${offer.id}?request=${request.id}`);
    } catch (err) {
      console.error('Failed to create seat request:', err);
    } finally {
      setRequestingOffer(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">자리 찾기</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">빈자리를 미리 확인하세요</p>

      {/* Step 1: 출발/도착역 */}
      {step === 'route' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">출발역</label>
            <StationSelector
              placeholder="출발역을 검색하세요"
              value={fromStation}
              onChange={(s) => { setFromStation(s); if (s) addRecent(s); }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">도착역</label>
            <StationSelector
              placeholder="도착역을 검색하세요"
              value={toStation}
              onChange={(s) => { setToStation(s); if (s) addRecent(s); }}
            />
          </div>

          {/* 저장된 경로 */}
          {savedRoutes.length > 0 && !fromStation && !toStation && (
            <div>
              <p className="text-xs text-gray-400 mb-2">저장된 경로</p>
              <div className="space-y-2">
                {savedRoutes.map((route) => (
                  <div key={route.id} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFromStation(route.from);
                        setToStation(route.to);
                      }}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-left active:bg-blue-100 dark:active:bg-blue-900/30"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-300">
                        {route.from.name} → {route.to.name}
                      </span>
                      <span className="text-[10px] text-blue-500 dark:text-blue-400">{route.from.lineNumber}호선</span>
                    </button>
                    <button
                      onClick={() => removeRoute(route.id)}
                      className="p-1.5 text-gray-300 hover:text-gray-500"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && !fromStation && !toStation && (
            <div>
              <p className="text-xs text-gray-400 mb-2">최근 이용역</p>
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 6).map((s) => (
                  <button
                    key={`${s.lineNumber}-${s.code}`}
                    onClick={() => {
                      if (!fromStation) setFromStation(s);
                      else if (!toStation) setToStation(s);
                    }}
                    className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {s.name} ({s.lineNumber}호선)
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={!fromStation || !toStation}
              onClick={() => setStep('arrivals')}
              className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 active:bg-blue-700 transition-colors text-base"
            >
              열차 검색
            </button>
            {fromStation && toStation && (
              <button
                onClick={() => saveRoute(fromStation, toStation)}
                className="px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 active:bg-gray-200"
                title="경로 저장"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: 열차 선택 */}
      {step === 'arrivals' && fromStation && (
        <div>
          <button
            onClick={() => setStep('route')}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            경로 수정
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-white">{fromStation.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="font-medium text-gray-900 dark:text-white">{toStation?.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold dark:text-white">도착 예정 열차</h2>
            <button
              onClick={refresh}
              className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              새로고침
            </button>
          </div>

          {loading && arrivals.length === 0 ? (
            <SkeletonArrivalList />
          ) : (
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
          )}
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
            }}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            열차 목록
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedTrain.bstatnNm}행 · {selectedTrain.arvlMsg2}
            </div>
          </div>

          {!carType ? (
            <CarTypeSelector
              lineNumber={lineNumber}
              selected={carType}
              onSelect={setCarType}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">좌석 현황</h2>
                <button
                  onClick={() => setCarType(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 underline"
                >
                  차량 타입 변경
                </button>
              </div>

              <SeatMap
                lineNumber={lineNumber}
                carType={carType}
                carSeatStatuses={seatStatuses}
                onSeatSelect={(carNum, seat) => {
                  const status = seatStatuses[carNum]?.[seat.id];
                  if (status === 'available') {
                    setRequestedSeat({ car: carNum, seat });
                    if (navigator.vibrate) navigator.vibrate(30);
                  }
                }}
                selectedSeatId={requestedSeat?.seat.id}
              />

              {requestedSeat && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">
                    {requestedSeat.car}호차 {requestedSeat.seat.id} 좌석을 요청할까요?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRequestedSeat(null)}
                      className="flex-1 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleRequest}
                      disabled={requestingOffer}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold active:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                    >
                      {requestingOffer ? '요청 중...' : '좌석 요청'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
