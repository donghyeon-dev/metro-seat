'use client';

import { useState } from 'react';
import LineSelector from '@/components/LineSelector';
import CarTypeSelector from '@/components/CarTypeSelector';
import StationSelector from '@/components/StationSelector';
import ArrivalInfo from '@/components/ArrivalInfo';
import SeatMap from '@/components/SeatMap';
import { useArrivalInfo } from '@/hooks/useArrivalInfo';
import { getStationsByLine } from '@/data/stations';
import { createClient } from '@/lib/supabase/client';
import type { LineNumber, CarType, Station, ArrivalInfo as ArrivalInfoType, SeatPosition, Direction } from '@/types';

type Step = 'line' | 'station' | 'train' | 'carType' | 'seat' | 'exit' | 'confirm';

const STEP_ORDER: Step[] = ['line', 'station', 'train', 'carType', 'seat', 'exit', 'confirm'];

export default function ProvidePage() {
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

  const { arrivals, loading, error } = useArrivalInfo({
    stationName: step === 'train' ? currentStation?.name ?? null : null,
    lineNumber,
  });

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = STEP_ORDER.length - 1; // confirm 제외

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

      const templateId = `line${lineNumber}-${carType}`;
      const direction: Direction = selectedTrain?.updnLine ?? 'up';

      const { error: insertError } = await supabase.from('seat_offers').insert({
        provider_id: user.id,
        line_number: lineNumber,
        direction,
        train_destination: selectedTrain?.bstatnNm ?? '',
        train_number: trainNumber || selectedTrain?.btrainNo || null,
        car_number: selectedCar,
        seat_id: selectedSeat!.id,
        template_id: templateId,
        exit_station: exitStation!.name,
        exit_station_code: exitStation!.code,
        boarding_station: currentStation!.name,
        status: 'available',
      });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to create seat offer:', err);
      setSubmitError('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="px-4 pt-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">자리 등록 완료!</h2>
          <p className="text-sm text-gray-500 mb-1">
            {lineNumber}호선 {selectedCar}호차 {selectedSeat?.id}
          </p>
          <p className="text-sm text-gray-500 mb-6">
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
          <button onClick={goBack} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">자리 제공하기</h1>
      </div>
      <p className="text-sm text-gray-500 mb-4">내 자리 정보를 등록해주세요</p>

      {/* 진행 바 */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step: 호선 선택 */}
      {step === 'line' && (
        <div>
          <h2 className="text-base font-semibold mb-4">몇 호선을 타고 계신가요?</h2>
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
          <h2 className="text-base font-semibold mb-4">현재 어느 역에 계신가요?</h2>
          <StationSelector
            placeholder={`${lineNumber}호선 역을 검색하세요`}
            value={currentStation}
            onChange={(station) => {
              setCurrentStation(station);
              if (station) goNext();
            }}
            lineFilter={lineNumber}
          />
          {/* 빠른 선택: 해당 호선 역 목록 */}
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
                    className="px-3 py-1.5 text-xs bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 active:bg-gray-300"
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
          <h2 className="text-base font-semibold mb-2">탑승 중인 열차를 선택하세요</h2>
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

          {/* 열차번호 직접 입력 옵션 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">열차번호를 알고 있다면 직접 입력 (선택사항)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="예: 2315"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={goNext}
                disabled={!selectedTrain && !trainNumber}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:bg-gray-300"
              >
                다음
              </button>
            </div>
          </div>

          {/* 건너뛰기 */}
          <button
            onClick={goNext}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600"
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
          <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
            <p className="text-xs text-yellow-800">
              💡 구형: 좁은 좌석이 빽빽하게 / 신형: 넓은 좌석이 여유 있게 배치되어 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Step: 좌석 선택 */}
      {step === 'seat' && lineNumber && carType && (
        <div>
          <h2 className="text-base font-semibold mb-4">앉아 계신 좌석을 선택하세요</h2>
          <SeatMap
            lineNumber={lineNumber}
            carType={carType}
            selectedCar={selectedCar}
            selectedSeatId={selectedSeat?.id}
            onSeatSelect={(carNum, seat) => {
              setSelectedCar(carNum);
              setSelectedSeat(seat);
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
          <h2 className="text-base font-semibold mb-4">어느 역에서 내리시나요?</h2>
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
                    className="px-3 py-1.5 text-xs bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200"
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
          <h2 className="text-base font-semibold mb-4">등록 정보를 확인해주세요</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
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
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700 transition-colors disabled:bg-gray-300"
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
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
