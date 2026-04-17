'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import TrustBadge from '@/components/TrustBadge';
import NotificationBanner from '@/components/NotificationBanner';
import { SkeletonList } from '@/components/Skeleton';
import { useTheme } from '@/components/ThemeProvider';
import type { SeatOffer, SeatRequest, Profile } from '@/types';

export default function MyPage() {
  const { user: authUser, ready } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myOffers, setMyOffers] = useState<SeatOffer[]>([]);
  const [myRequests, setMyRequests] = useState<(SeatRequest & { offer?: SeatOffer })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>('offers');
  const [pendingRequests, setPendingRequests] = useState<SeatRequest[]>([]);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (ready && authUser) loadData();
    else if (ready) setLoading(false);
  }, [ready, authUser]);

  async function loadData() {
    if (!authUser) return;
    const supabase = createClient();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);
      setNicknameInput(profileData.nickname);
    }

    const { data: offers } = await supabase
      .from('seat_offers')
      .select('*')
      .eq('provider_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (offers) setMyOffers(offers as SeatOffer[]);

    const { data: requests } = await supabase
      .from('seat_requests')
      .select('*, offer:seat_offers(*)')
      .eq('seeker_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (requests) setMyRequests(requests as (SeatRequest & { offer?: SeatOffer })[]);

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

    if (accept && navigator.vibrate) navigator.vibrate(100);
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

  async function handleSaveNickname() {
    if (!authUser || !nicknameInput.trim()) return;
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ nickname: nicknameInput.trim() })
      .eq('id', authUser.id);

    setProfile(prev => prev ? { ...prev, nickname: nicknameInput.trim() } : prev);
    setEditingNickname(false);
  }

  if (!ready || loading) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">내 현황</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">제공 중인 자리와 요청 현황</p>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          {editingNickname ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={20}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveNickname}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
              >
                저장
              </button>
              <button
                onClick={() => setEditingNickname(false)}
                className="px-3 py-1.5 text-gray-500 text-xs"
              >
                취소
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile?.nickname || '사용자'}
                </h1>
                <button
                  onClick={() => setEditingNickname(true)}
                  className="text-xs text-gray-400 underline"
                >
                  수정
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <TrustBadge profile={profile} size="md" />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          title={`현재: ${theme === 'system' ? '시스템' : theme === 'dark' ? '다크' : '라이트'}`}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </button>
      </div>

      {/* 대기 중인 요청 알림 */}
      {pendingRequests.map((req) => (
        <div key={req.id} className="mb-3">
          <NotificationBanner
            type="request"
            title="좌석 요청이 왔습니다!"
            message="누군가 내 좌석을 요청했습니다."
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
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'offers'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          내 제공 ({myOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
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
              <Link href="/provide" className="text-blue-600 dark:text-blue-400 text-sm mt-2 inline-block">
                자리 제공하기
              </Link>
            </div>
          ) : (
            myOffers.map((offer) => (
              <Link
                key={offer.id}
                href={offer.status === 'available' || offer.status === 'reserved' ? `/session/${offer.id}` : '#'}
                className="block bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {offer.line_number}호선 {offer.car_number}호차
                  </span>
                  <StatusBadge status={offer.status} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>좌석: {offer.seat_id} · 하차: {offer.exit_station}</p>
                </div>
                {offer.status === 'available' && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleCancelOffer(offer.id); }}
                    className="mt-3 text-xs text-red-500 underline"
                  >
                    제공 취소
                  </button>
                )}
              </Link>
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
              <Link href="/seek" className="text-blue-600 dark:text-blue-400 text-sm mt-2 inline-block">
                자리 찾기
              </Link>
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {req.offer
                      ? `${req.offer.line_number}호선 ${req.offer.car_number}호차 ${req.offer.seat_id}`
                      : '좌석 정보'}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                {req.offer && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {req.offer.exit_station}역 하차 예정
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 설정 */}
      <div className="mt-6 mb-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">설정</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <NotificationSetting />
        </div>
      </div>
    </div>
  );
}

function NotificationSetting() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">푸시 알림</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {permission === 'granted' ? '알림 허용됨' : permission === 'denied' ? '알림 차단됨 (브라우저 설정에서 변경)' : '요청 도착, 수락 알림 받기'}
        </p>
      </div>
      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
        >
          허용
        </button>
      )}
      {permission === 'granted' && (
        <span className="text-green-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
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
