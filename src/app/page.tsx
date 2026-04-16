'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { LINE_COLORS } from '@/lib/constants';
import type { SeatOffer, SeatRequest } from '@/types';

export default function Home() {
  const { user, ready } = useAuth();
  const [activeOffer, setActiveOffer] = useState<SeatOffer | null>(null);
  const [activeRequest, setActiveRequest] = useState<(SeatRequest & { offer?: SeatOffer }) | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !user) { setLoaded(true); return; }
    async function loadActive() {
      const supabase = createClient();

      const { data: offers } = await supabase
        .from('seat_offers')
        .select('*')
        .eq('provider_id', user!.id)
        .in('status', ['available', 'reserved'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (offers && offers.length > 0) setActiveOffer(offers[0] as SeatOffer);

      const { data: requests } = await supabase
        .from('seat_requests')
        .select('*, offer:seat_offers(*)')
        .eq('seeker_id', user!.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) setActiveRequest(requests[0] as SeatRequest & { offer?: SeatOffer });
      setLoaded(true);
    }
    loadActive();
  }, [ready, user]);

  return (
    <div className="px-4 pt-8">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <TrainIcon />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">메트로시트</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">지하철 자리를 나눠보세요</p>
      </div>

      {/* 활성 세션 카드 */}
      {loaded && activeOffer && (
        <Link
          href={`/session/${activeOffer.id}`}
          className="block mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">내 자리 제공 중</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              activeOffer.status === 'reserved'
                ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
            }`}>
              {activeOffer.status === 'reserved' ? '매칭됨' : '대기 중'}
            </span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {activeOffer.line_number}호선 {activeOffer.car_number}호차 {activeOffer.seat_id} · {activeOffer.exit_station}역 하차
          </p>
        </Link>
      )}

      {loaded && activeRequest && activeRequest.offer && (
        <Link
          href={`/session/${activeRequest.offer_id}?request=${activeRequest.id}`}
          className="block mb-4 bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-green-900 dark:text-green-300">좌석 이동 중</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              activeRequest.status === 'accepted'
                ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
            }`}>
              {activeRequest.status === 'accepted' ? '수락됨' : '대기 중'}
            </span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-400">
            {activeRequest.offer!.line_number}호선 {activeRequest.offer!.car_number}호차 {activeRequest.offer!.seat_id}
          </p>
        </Link>
      )}

      {/* 메인 액션 카드 */}
      <div className="space-y-3">
        <Link
          href="/provide"
          className="block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">자리 제공하기</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                내려야 할 때 자리를 다른 사람에게
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/seek"
          className="block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">자리 찾기</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                내가 탈 열차의 빈자리 확인
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 호선 빠른 선택 */}
      <div className="mt-6">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">호선 빠른 선택</h3>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((line) => (
            <Link
              key={line}
              href={`/seek?line=${line}`}
              className="flex items-center justify-center h-11 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform"
              style={{ backgroundColor: LINE_COLORS[line] }}
            >
              {line}호선
            </Link>
          ))}
        </div>
      </div>

      {/* 이용 방법 */}
      <div className="mt-6 mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">이용 방법</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
          <p>1. 제공자: 하차할 역과 좌석을 등록</p>
          <p>2. 이용자: 열차를 선택하고 빈자리 요청</p>
          <p>3. 좌석 앞에서 간단히 확인 후 자리 이어받기</p>
        </div>
      </div>
    </div>
  );
}

function TrainIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="6" y="4" width="20" height="22" rx="4" fill="#0052A4" />
      <rect x="9" y="8" width="14" height="8" rx="2" fill="#E0F2FE" />
      <circle cx="11" cy="21" r="2" fill="#FCD34D" />
      <circle cx="21" cy="21" r="2" fill="#FCD34D" />
      <rect x="8" y="26" width="4" height="2" rx="1" fill="#6B7280" />
      <rect x="20" y="26" width="4" height="2" rx="1" fill="#6B7280" />
    </svg>
  );
}
