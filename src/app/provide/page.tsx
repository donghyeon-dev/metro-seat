'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StationSelector from '@/components/StationSelector';
import CarTypeSelector from '@/components/CarTypeSelector';
import ArrivalInfo from '@/components/ArrivalInfo';
import SeatMap from '@/components/SeatMap';
import { useAuth } from '@/components/AuthProvider';
import { useArrivalInfo } from '@/hooks/useArrivalInfo';
import { useRecentStations } from '@/hooks/useStationHistory';
import { getStationsByLine } from '@/data/stations';
import { createClient } from '@/lib/supabase/client';
import { ensureProfileExists } from '@/lib/supabase/ensure-profile';
import type { LineNumber, CarType, Station, ArrivalInfo as ArrivalInfoType, SeatPosition, Direction } from '@/types';

// 4-step flow: station → train → seat → exit+confirm
type Step = 'station' | 'train' | 'seat' | 'exit';

const STEP_ORDER: Step[] = ['station', 'train', 'seat', 'exit'];
const DRAFT_KEY = 'metro-seat:provide-draft';

interface ProvideState {
  step: Step;
  currentStationCode: string | null;
  lineNumber: LineNumber | null;
  carType: CarType | null;
  selectedCar: number;
  trainNumber: string;
}

function saveDraft(state: ProvideState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...state, ts: Date.now() }));
  } catch {}
}

function loadDraft(): ProvideState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.ts && Date.now() - parsed.ts > 30 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = error.message;
    return typeof message === 'string' ? message : null;
  }
  return null;
}

export default function ProvidePage() {
  const router = useRouter();
  const { user, ready, authError, retry } = useAuth();
  const [step, setStep] = useState<Step>('station');
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<ArrivalInfoType | null>(null);
  const [carType, setCarType] = useState<CarType | null>(null);
  const [selectedCar, setSelectedCar] = useState<number>(1);
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [exitStation, setExitStation] = useState<Station | null>(null);
  const [trainNumber, setTrainNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const { addRecent } = useRecentStations();

  const lineNumber = currentStation?.lineNumber as LineNumber | undefined;

  // 드래프트 복원
  useEffect(() => {
    if (!ready || draftLoaded) return;
    const draft = loadDraft();
    if (draft && draft.currentStationCode && draft.lineNumber) {
      const stations = getStationsByLine(draft.lineNumber);
      const found = stations.find((s) => s.code === draft.currentStationCode);
      if (found) {
        setCurrentStation(found);
        setStep(draft.step === 'exit' ? 'station' : draft.step);
      }
      if (draft.carType) setCarType(draft.carType);
      if (draft.selectedCar) setSelectedCar(draft.selectedCar);
      if (draft.trainNumber) setTrainNumber(draft.trainNumber);
    }
    setDraftLoaded(true);
  }, [ready, draftLoaded]);

  // 드래프트 자동 저장
  const saveDraftDebounced = useCallback(() => {
    saveDraft({
      step,
      lineNumber: lineNumber ?? null,
      currentStationCode: currentStation?.code ?? null,
      carType,
      selectedCar,
      trainNumber,
    });
  }, [step, lineNumber, currentStation, carType, selectedCar, trainNumber]);

  useEffect(() => {
    if (draftLoaded) saveDraftDebounced();
  }, [saveDraftDebounced, draftLoaded]);

  const { arrivals, loading: arrivalsLoading, error: arrivalsError } = useArrivalInfo({
    stationName: step === 'train' ? currentStation?.name ?? null : null,
    lineNumber,
  });

  const stepIndex = STEP_ORDER.indexOf(step);
  const canSubmit = !!user && !!lineNumber && !!selectedSeat && !!exitStation && !!currentStation && !submitting;
  const authBlocker = ready && !user
    ? (authError ?? '인증 정보를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.')
    : null;

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  async function handleSubmit() {
    if (!user) {
      setSubmitError('인증 정보를 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!lineNumber || !selectedSeat || !exitStation || !currentStation) {
      setSubmitError('현재역, 좌석, 하차역을 모두 선택해주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      await ensureProfileExists(supabase, user);

      const direction: Direction = selectedTrain?.updnLine ?? 'up';

      const { data: offer, error: insertError } = await supabase.from('seat_offers').insert({
        provider_id: user.id,
        line_number: lineNumber,
        direction,
        train_destination: selectedTrain?.bstatnNm ?? '',
        train_number: trainNumber || selectedTrain?.btrainNo || null,
        car_number: selectedCar,
        seat_id: selectedSeat.id,
        template_id: null,
        exit_station: exitStation.name,
        exit_station_code: exitStation.code,
        boarding_station: currentStation.name,
        status: 'available',
      }).select('id').single();

      if (insertError) throw insertError;

      if (currentStation) addRecent(currentStation);
      if (exitStation) addRecent(exitStation);
      if (navigator.vibrate) navigator.vibrate(200);
      clearDraft();

      // 라이브 세션 화면으로 이동
      router.push(`/session/${offer.id}`);
    } catch (err) {
      console.error('Failed to create seat offer:', err);
      const message = getErrorMessage(err);
      setSubmitError(message ? '등록에 실패했습니다. ' + message : '등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="px-4 pt-6">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-1">
        {step !== 'station' && (
          <button onClick={goBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">자리 제공하기</h1>
      </div>

      {/* 진행 바 */}
      <div className="flex gap-1 mb-6 mt-3">
        {STEP_ORDER.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step 1: 현재역 선택 (호선 자동 판별) */}
      {step === 'station' && (
        <div>
          <h2 className="text-base font-semibold mb-1 dark:text-white">지금 어느 역에 계신가요?</h2>
          <p className="text-xs text-gray-400 mb-4">역을 선택하면 호선이 자동으로 설정됩니다</p>
          <StationSelector
            placeholder="역 이름을 검색하세요"
            value={currentStation}
            onChange={(station) => {
              setCurrentStation(station);
              if (station) {
                setSelectedTrain(null);
                setCarType(null);
                setSelectedSeat(null);
                setExitStation(null);
                goNext();
              }
            }}
          />
        </div>
      )}

      {/* Step 2: 열차 선택 */}
      {step === 'train' && currentStation && lineNumber && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base font-semibold dark:text-white">
              {lineNumber}호선 {currentStation.name}역
            </span>
          </div>

          <ArrivalInfo
            arrivals={arrivals}
            loading={arrivalsLoading}
            error={arrivalsError}
            onSelect={(arrival) => {
              setSelectedTrain(arrival);
              goNext();
            }}
            selectedTrainNo={selectedTrain?.btrainNo}
          />

          <button
            onClick={goNext}
            className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl"
          >
            열차 정보 없이 진행
          </button>
        </div>
      )}

      {/* Step 3: 차량타입 + 좌석 선택 */}
      {step === 'seat' && lineNumber && (
        <div>
          {!carType ? (
            <div>
              <h2 className="text-base font-semibold mb-4 dark:text-white">차량 타입을 선택하세요</h2>
              <CarTypeSelector
                lineNumber={lineNumber}
                selected={carType}
                onSelect={setCarType}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold dark:text-white">좌석을 선택하세요</h2>
                <button
                  onClick={() => { setCarType(null); setSelectedSeat(null); }}
                  className="text-xs text-gray-400 underline"
                >
                  차량 타입 변경
                </button>
              </div>
              <SeatMap
                lineNumber={lineNumber}
                carType={carType}
                selectedCar={selectedCar}
                selectedSeatId={selectedSeat?.id}
                onCarChange={(carNum) => {
                  setSelectedCar(carNum);
                  setSelectedSeat(null);
                }}
                onSeatSelect={(carNum, seat) => {
                  setSelectedCar(carNum);
                  setSelectedSeat(seat);
                  if (navigator.vibrate) navigator.vibrate(30);
                }}
              />
              {selectedSeat && (
                <button
                  onClick={goNext}
                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700"
                >
                  {selectedCar}호차 {selectedSeat.id} 선택 완료
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: 하차역 + 요약 + 등록 */}
      {step === 'exit' && lineNumber && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">어디에서 내리시나요?</h2>
          <StationSelector
            placeholder="하차역을 검색하세요"
            value={exitStation}
            onChange={setExitStation}
            lineFilter={lineNumber}
          />
          {!exitStation && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {getStationsByLine(lineNumber).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => setExitStation(s)}
                    className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {authBlocker && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{authBlocker}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 text-xs font-medium text-red-700 dark:text-red-300 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {exitStation && (
            <div className="mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 space-y-2">
                <SummaryRow label="현재역" value={`${lineNumber}호선 ${currentStation?.name}`} />
                <SummaryRow label="열차" value={selectedTrain ? `${selectedTrain.bstatnNm}행` : '미지정'} />
                <SummaryRow label="좌석" value={`${selectedCar}호차 ${selectedSeat?.id}`} />
                <SummaryRow label="하차역" value={exitStation.name} />
              </div>

              {submitError && (
                <p className="mt-3 text-sm text-red-600 text-center">{submitError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full mt-4 py-3.5 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 text-base"
              >
                {submitting ? '등록 중...' : !user ? '인증 확인 필요' : '자리 등록하기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
