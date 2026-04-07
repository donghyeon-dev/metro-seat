'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import NotificationBanner from '@/components/NotificationBanner';
import type { SeatOffer, SeatRequest, Profile } from '@/types';

export default function MyPage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [myOffers, setMyOffers] = useState<SeatOffer[]>([]);
  const [myRequests, setMyRequests] = useState<(SeatRequest & { offer?: SeatOffer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>('offers');
  const [pendingRequests, setPendingRequests] = useState<SeatRequest[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    // 프로필
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile) setUser(profile as Profile);

    // 내 제공 목록
    const { data: offers } = await supabase
      .from('seat_offers')
      .select('*')
      .eq('provider_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (offers) setMyOffers(offers as SeatOffer[]);

    // 내 요청 목록
    const { data: requests } = await supabase
      .from('seat_requests')
      .select('*, offer:seat_offers(*)')
      .eq('seeker_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (requests) setMyRequests(requests as (SeatRequest & { offer?: SeatOffer })[]);

    // 내 제공에 대한 대기중 요청
    if (offers && offers.length > 0) {
      const activeOfferIds = (offers as SeatOffer[])
        .filter((o) => o.status === 'available')
        .map((o) => o.id);

      if (activeOfferIds.length > 0) {
        const { data: pending } = await supabase
          .from('seat_requests')
          .select('*')
          .in('offer_id', activeOfferIds)
          .eq('status', 'pending');

        if (pending) setPendingRequests(pending as SeatRequest[]);
      }
    }

    setLoading(false);
  }

  async function handleRespondRequest(requestId: string, accept: boolean) {
    const supabase = createClient();
    await supabase
      .from('seat_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId);

    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  async function handleCancelOffer(offerId: string) {
    const supabase = createClient();
    await supabase
      .from('seat_offers')
      .update({ status: 'cancelled' })
      .eq('id', offerId);

    setMyOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'cancelled' } : o))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">내 현황</h1>
        <p className="text-sm text-gray-500 mb-6">제공 중인 자리와 요청 현황</p>
        <div className="text-center py-16">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto mb-4">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p className="text-sm text-gray-500 mb-4">로그인 후 이용할 수 있습니다</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            시작하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.nickname}</h1>
          <p className="text-sm text-gray-500">내 현황</p>
        </div>
      </div>

      {/* 대기 중인 요청 알림 */}
      {pendingRequests.map((req) => (
        <div key={req.id} className="mb-3">
          <NotificationBanner
            type="request"
            title="좌석 요청이 왔습니다!"
            message="누군가 내 좌석을 요청했습니다. 좌석 앞에 사람이 있다면 수락해주세요."
            actions={[
              {
                label: '거절',
                onClick: () => handleRespondRequest(req.id, false),
                variant: 'secondary',
              },
              {
                label: '수락',
                onClick: () => handleRespondRequest(req.id, true),
                variant: 'primary',
              },
            ]}
          />
        </div>
      ))}

      {/* 탭 */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'offers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          내 제공 ({myOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          내 요청 ({myRequests.length})
        </button>
      </div>

      {/* 제공 목록 */}
      {activeTab === 'offers' && (
        <div className="space-y-3">
          {myOffers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">제공한 자리가 없습니다</p>
              <Link href="/provide" className="text-blue-600 text-sm mt-2 inline-block">
                자리 제공하기 →
              </Link>
            </div>
          ) : (
            myOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {offer.line_number}호선 {offer.car_number}호차
                  </span>
                  <StatusBadge status={offer.status} />
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>좌석: {offer.seat_id} · 하차: {offer.exit_station}</p>
                  <p>{offer.train_destination}행</p>
                </div>
                {offer.status === 'available' && (
                  <button
                    onClick={() => handleCancelOffer(offer.id)}
                    className="mt-3 text-xs text-red-500 underline"
                  >
                    제공 취소
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 요청 목록 */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">요청한 자리가 없습니다</p>
              <Link href="/seek" className="text-blue-600 text-sm mt-2 inline-block">
                자리 찾기 →
              </Link>
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {req.offer
                      ? `${req.offer.line_number}호선 ${req.offer.car_number}호차 ${req.offer.seat_id}`
                      : '좌석 정보'}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                {req.offer && (
                  <p className="text-xs text-gray-500">
                    {req.offer.exit_station}역 하차 예정
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    reserved: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  const labels: Record<string, string> = {
    available: '이용가능',
    pending: '대기중',
    reserved: '예약됨',
    accepted: '수락됨',
    rejected: '거절됨',
    completed: '완료',
    cancelled: '취소됨',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
}
