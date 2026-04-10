'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LineSelector from '@/components/LineSelector';
import CarTypeSelector from '@/components/CarTypeSelector';
import StationSelector from '@/components/StationSelector';
import ArrivalInfo from '@/components/ArrivalInfo';
import SeatMap from '@/components/SeatMap';
import { useArrivalInfo } from '@/hooks/useArrivalInfo';
import { useRecentStations } from '@/hooks/useStationHistory';
import { getStationsByLine } from '@/data/stations';
import { createClient } from '@/lib/supabase/client';
import { ensureProfileExists } from '@/lib/supabase/ensure-profile';
import type { LineNumber, CarType, Station, ArrivalInfo as ArrivalInfoType, SeatPosition, Direction } from '@/types';

type Step = 'line' | 'station' | 'train' | 'carType' | 'seat' | 'exit' | 'confirm';

const STEP_ORDER: Step[] = ['line', 'station', 'train', 'carType', 'seat', 'exit', 'confirm'];
const DRAFT_KEY = 'metro-seat:provide-draft';

interface ProvideState {
  step: Step;
  lineNumber: LineNumber | null;
  currentStationCode: string | null;
  carType: CarType | null;
  selectedCar: number;
  trainNumber: string;
}

function saveDraft(state: ProvideState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {}
}

function loadDraft(): ProvideState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 30분 이상 된 드래프트는 무시 (타임스탬프가 없으면 유효)
    return parsed;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export default function ProvidePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState<Step>('line');
  const [lineNumber, setLineNumber] = useState<LineNumber | null>(null);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<ArrivalInfoType | null>(null);
  const [carType, setCarType] = useState<CarType | null>(null);
  const [selectedCar, setSelectedCar] = useState<number>(1);
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [exitStation, setExitStation] = useState<Station | null>(null);
  const [trainNumber, setTrainNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const { addRecent } = useRecentStations();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  // 드래프트 복원
  useEffect(() => {
    if (!authChecked || !isLoggedIn || draftLoaded) return;
    const draft = loadDraft();
    if (draft && draft.lineNumber) {
      setLineNumber(draft.lineNumber);
      setStep(draft.step === 'confirm' ? 'line' : draft.step);
      if (draft.carType) setCarType(draft.carType);
      if (draft.selectedCar) setSelectedCar(draft.selectedCar);
      if (draft.trainNumber) setTrainNumber(draft.trainNumber);
      if (draft.currentStationCode) {
        const stations = getStationsByLine(draft.lineNumber);
        const found = stations.find((s) => s.code === draft.currentStationCode);
        if (found) setCurrentStation(found);
      }
    }
    setDraftLoaded(true);
  }, [authChecked, isLoggedIn, draftLoaded]);

  // 드래프트 자동 저장
  const saveDraftDebounced = useCallback(() => {
    if (!isLoggedIn) return;
    saveDraft({
      step,
      lineNumber,
      currentStationCode: currentStation?.code ?? null,
      carType,
      selectedCar,
      trainNumber,
    });
  }, [step, lineNumber, currentStation, carType, selectedCar, trainNumber, isLoggedIn]);

  useEffect(() => {
    if (draftLoaded && !submitted) {
      saveDraftDebounced();
    }
  }, [saveDraftDebounced, draftLoaded, submitted]);

  const { arrivals, loading, error } = useArrivalInfo({
    stationName: step === 'train' ? currentStation?.name ?? null : null,
    lineNumber,
  });

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length - 1;

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      setStep(STEP_ORDER[idx - 1]);
    }
  }

  function reset() {
    setStep('line');
    setLineNumber(null);
    setCurrentStation(null);
    setSelectedTrain(null);
    setCarType(null);
    setSelectedCar(1);
    setSelectedSeat(null);
    setExitStation(null);
    setTrainNumber('');
    setSubmitted(false);
    clearDraft();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError('로그인이 필요합니다');
        setSubmitting(false);
        return;
      }

      await ensureProfileExists(supabase, user);

      const direction: Direction = selectedTrain?.updnLine ?? 'up';

      const { error: insertError } = await supabase.from('seat_offers').insert({
        provider_id: user.id,
        line_number: lineNumber,
        direction,
        train_destination: selectedTrain?.bstatnNm ?? '',
        train_number: trainNumber || selectedTrain?.btrainNo || null,
        car_number: selectedCar,
        seat_id: selectedSeat!.id,
        template_id: null,
        exit_station: exitStation!.name,
        exit_station_code: exitStation!.code,
        boarding_station: currentStation!.name,
        status: 'available',
      });

      if (insertError) throw insertError;

      // 최근 역 기록
      if (currentStation) addRecent(currentStation);
      if (exitStation) addRecent(exitStation);

      // 진동 피드백
      if (navigator.vibrate) navigator.vibrate(200);

      clearDraft();
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to create seat offer:', err);
      setSubmitError('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="px-4 pt-6">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="px-4 pt-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">로그인이 필요합니다</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            자리를 제공하려면 먼저 로그인해주세요
          </p>
          <Link
            href="/auth/login?redirect=/provide"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
          <button
            onClick={() => router.push('/')}
            className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="px-4 pt-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">자리 등록 완료!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {lineNumber}호선 {selectedCar}호차 {selectedSeat?.id}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {exitStation?.name}역에서 하차 예정
          </p>
          <p className="text-xs text-gray-400 mb-8">
            누군가 좌석을 요청하면 알림을 보내드립니다
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-1">
        {step !== 'line' && (
          <button onClick={goBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">자리 제공하기</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">내 자리 정보를 등록해주세요</p>

      {/* 진행 바 */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step: 호선 선택 */}
      {step === 'line' && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">몇 호선을 타고 계신가요?</h2>
          <LineSelector
            selected={lineNumber}
            onSelect={(line) => {
              setLineNumber(line);
              setCurrentStation(null);
              goNext();
            }}
          />
        </div>
      )}

      {/* Step: 현재역 선택 */}
      {step === 'station' && lineNumber && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">현재 어느 역에 계신가요?</h2>
          <StationSelector
            placeholder={`${lineNumber}호선 역을 검색하세요`}
            value={currentStation}
            onChange={(station) => {
              setCurrentStation(station);
              if (station) goNext();
            }}
            lineFilter={lineNumber}
          />
          {!currentStation && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">또는 목록에서 선택</p>
              <div className="flex flex-wrap gap-2">
                {getStationsByLine(lineNumber).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => {
                      setCurrentStation(s);
                      goNext();
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: 열차 선택 */}
      {step === 'train' && currentStation && (
        <div>
          <h2 className="text-base font-semibold mb-2 dark:text-white">탑승 중인 열차를 선택하세요</h2>
          <p className="text-xs text-gray-400 mb-4">{currentStation.name}역 실시간 도착정보</p>

          <ArrivalInfo
            arrivals={arrivals}
            loading={loading}
            error={error}
            onSelect={(arrival) => {
              setSelectedTrain(arrival);
              goNext();
            }}
            selectedTrainNo={selectedTrain?.btrainNo}
          />

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-2">열차번호를 알고 있다면 직접 입력 (선택사항)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="예: 2315"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={goNext}
                disabled={!selectedTrain && !trainNumber}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                다음
              </button>
            </div>
          </div>

          <button
            onClick={goNext}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            열차 정보 없이 진행하기
          </button>
        </div>
      )}

      {/* Step: 차량 타입 선택 */}
      {step === 'carType' && lineNumber && (
        <div>
          <CarTypeSelector
            lineNumber={lineNumber}
            selected={carType}
            onSelect={(type) => {
              setCarType(type);
              goNext();
            }}
          />
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              구형: 좁은 좌석이 빽빽하게 / 신형: 넓은 좌석이 여유 있게 배치되어 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Step: 좌석 선택 */}
      {step === 'seat' && lineNumber && carType && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">앉아 계신 좌석을 선택하세요</h2>
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

      {/* Step: 하차역 입력 */}
      {step === 'exit' && lineNumber && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">어느 역에서 내리시나요?</h2>
          <StationSelector
            placeholder="하차역을 검색하세요"
            value={exitStation}
            onChange={(station) => {
              setExitStation(station);
              if (station) goNext();
            }}
            lineFilter={lineNumber}
          />
          {!exitStation && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">또는 목록에서 선택</p>
              <div className="flex flex-wrap gap-2">
                {getStationsByLine(lineNumber).map((s) => (
                  <button
                    key={s.code}
                    onClick={() => {
                      setExitStation(s);
                      goNext();
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: 확인 및 등록 */}
      {step === 'confirm' && (
        <div>
          <h2 className="text-base font-semibold mb-4 dark:text-white">등록 정보를 확인해주세요</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <InfoRow label="호선" value={`${lineNumber}호선`} />
            <InfoRow label="현재역" value={currentStation?.name ?? '-'} />
            <InfoRow label="열차" value={selectedTrain ? `${selectedTrain.bstatnNm}행${trainNumber ? ` (${trainNumber})` : ''}` : trainNumber || '-'} />
            <InfoRow label="차량 타입" value={carType === 'old' ? '구형' : '신형'} />
            <InfoRow label="호차 / 좌석" value={`${selectedCar}호차 ${selectedSeat?.id ?? '-'}`} />
            <InfoRow label="하차역" value={exitStation?.name ?? '-'} />
          </div>

          {submitError && (
            <p className="mt-4 text-sm text-red-600 text-center">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {submitting ? '등록 중...' : '자리 등록하기'}
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
