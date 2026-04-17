'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import TrustBadge from '@/components/TrustBadge';
import MannerRatingModal from '@/components/MannerRatingModal';
import ReportModal from '@/components/ReportModal';
import GratitudeModal from '@/components/GratitudeModal';
import LoginNudge, { useNudge } from '@/components/LoginNudge';
import type { SeatOffer, SeatRequest, Profile } from '@/types';

const TEMPLATE_MESSAGES = [
  { key: 'nod', label: '고개 끄덕여 주세요', icon: '👋' },
  { key: 'black_mask', label: '검은 마스크 쓰고 있어요', icon: '😷' },
  { key: 'earphone', label: '이어폰 끼고 있어요', icon: '🎧' },
  { key: 'phone', label: '폰 보고 있어요', icon: '📱' },
  { key: 'thanks', label: '감사합니다!', icon: '🙏' },
];

type SessionMessage = {
  id: string;
  sender_id: string;
  message_key: string;
  created_at: string;
};

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, ready } = useAuth();
  const offerId = params.id as string;
  const requestIdParam = searchParams.get('request');

  const [offer, setOffer] = useState<SeatOffer | null>(null);
  const [requests, setRequests] = useState<SeatRequest[]>([]);
  const [myRequest, setMyRequest] = useState<SeatRequest | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const [counterpartProfile, setCounterpartProfile] = useState<Pick<Profile, 'id' | 'nickname' | 'manner_score' | 'total_provides'> | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGratitude, setShowGratitude] = useState(false);
  const [showNudge, setShowNudge] = useState<'first_complete' | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const { shouldShow, dismiss, incrementCompletion } = useNudge();

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const { data: offerData } = await supabase
      .from('seat_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerData) {
      setOffer(offerData as SeatOffer);
      setIsProvider(offerData.provider_id === user.id);
    }

    const { data: requestData } = await supabase
      .from('seat_requests')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (requestData) {
      setRequests(requestData as SeatRequest[]);
      const mine = requestData.find(
        (r: SeatRequest) => r.seeker_id === user.id && (r.id === requestIdParam || !requestIdParam)
      );
      if (mine) setMyRequest(mine as SeatRequest);
    }

    // Load messages
    const { data: msgData } = await supabase
      .from('session_messages')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: true });

    if (msgData) setMessages(msgData as SessionMessage[]);

    // Load counterpart profile for trust badge
    if (offerData) {
      const counterpartId = offerData.provider_id === user.id
        ? requestData?.find((r: SeatRequest) => r.status === 'accepted' || r.status === 'pending')?.seeker_id
        : offerData.provider_id;
      if (counterpartId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, nickname, manner_score, total_provides')
          .eq('id', counterpartId)
          .single();
        if (profileData) setCounterpartProfile(profileData);
      }

      // Check if already rated
      const { data: existingRating } = await supabase
        .from('manner_ratings')
        .select('id')
        .eq('rater_id', user.id)
        .eq('offer_id', offerId)
        .maybeSingle();
      if (existingRating) setHasRated(true);
    }

    setLoading(false);
  }, [user, offerId, requestIdParam]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 전용 데이터 패칭. SWR/TanStack Query 도입 전까지 예외 (DEV-BACKLOG R-7).
  useEffect(() => {
    if (ready && user) loadData();
  }, [ready, user, loadData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!ready || !user) return;
    const supabase = createClient();

    const offerChannel = supabase
      .channel(`session-offer-${offerId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seat_offers',
        filter: `id=eq.${offerId}`,
      }, (payload) => {
        setOffer(payload.new as SeatOffer);
      })
      .subscribe();

    const requestChannel = supabase
      .channel(`session-requests-${offerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seat_requests',
        filter: `offer_id=eq.${offerId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newReq = payload.new as SeatRequest;
          setRequests(prev => [newReq, ...prev]);
          if (newReq.seeker_id === user.id) setMyRequest(newReq);
          // 제공자에게 진동 알림
          if (offer?.provider_id === user.id && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as SeatRequest;
          setRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
          if (updated.seeker_id === user.id) setMyRequest(updated);
        }
      })
      .subscribe();

    const msgChannel = supabase
      .channel(`session-messages-${offerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `offer_id=eq.${offerId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SessionMessage]);
        if (payload.new.sender_id !== user.id && navigator.vibrate) {
          navigator.vibrate(100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(offerChannel);
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [ready, user, offerId, offer?.provider_id]);

  async function handleSomeoneInFront() {
    const supabase = createClient();
    await supabase.from('seat_offers').update({ someone_in_front: true }).eq('id', offerId);
  }

  async function handleSomeoneElseSat() {
    const supabase = createClient();
    await supabase.from('seat_offers').update({ status: 'cancelled' }).eq('id', offerId);
  }

  async function handleAcceptRequest(requestId: string) {
    const supabase = createClient();
    await supabase.from('seat_requests').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('seat_offers').update({ status: 'reserved' }).eq('id', offerId);
    if (navigator.vibrate) navigator.vibrate(100);
  }

  async function handleRejectRequest(requestId: string) {
    const supabase = createClient();
    await supabase.from('seat_requests').update({ status: 'rejected' }).eq('id', requestId);
  }

  async function handleComplete() {
    const supabase = createClient();
    await supabase.from('seat_offers').update({ status: 'completed' }).eq('id', offerId);
    if (myRequest) {
      await supabase.from('seat_requests').update({ status: 'accepted' }).eq('id', myRequest.id);
    }
    if (navigator.vibrate) navigator.vibrate(200);

    // Nudge check
    const count = incrementCompletion();
    if (count === 1 && shouldShow('first_complete')) {
      setTimeout(() => setShowNudge('first_complete'), 1500);
    }
  }

  async function handleSeekerArrived() {
    if (!myRequest) return;
    const supabase = createClient();
    // 이용자 도착 알림 - someone_in_front를 true로 설정
    await supabase.from('seat_offers').update({ someone_in_front: true }).eq('id', offerId);
    if (navigator.vibrate) navigator.vibrate(100);
  }

  async function sendMessage(messageKey: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('session_messages').insert({
      offer_id: offerId,
      sender_id: user.id,
      message_key: messageKey,
    });
  }

  async function handleCancelOffer() {
    const supabase = createClient();
    await supabase.from('seat_offers').update({ status: 'cancelled' }).eq('id', offerId);
  }

  async function handleCancelRequest() {
    if (!myRequest) return;
    const supabase = createClient();
    await supabase.from('seat_requests').update({ status: 'cancelled' }).eq('id', myRequest.id);
    router.push('/seek');
  }

  if (!ready || loading) {
    return (
      <div className="px-4 pt-6">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="px-4 pt-6 text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 mb-4">세션을 찾을 수 없습니다</p>
        <Link href="/" className="text-blue-600 dark:text-blue-400 text-sm">홈으로</Link>
      </div>
    );
  }

  const isCompleted = offer.status === 'completed';
  const isCancelled = offer.status === 'cancelled';
  const isEnded = isCompleted || isCancelled;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequest = requests.find(r => r.status === 'accepted');

  // ========== PROVIDER VIEW ==========
  if (isProvider) {
    return (
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">내 자리</h1>

        {/* 좌석 정보 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {offer.line_number}호선 {offer.car_number}호차
            </span>
            <StatusBadge status={offer.status} />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>좌석 {offer.seat_id} · {offer.exit_station}역 하차</p>
            {offer.train_destination && <p>{offer.train_destination}행</p>}
          </div>
        </div>

        {/* 종료된 경우 */}
        {isEnded && (
          <div className={`rounded-2xl p-6 text-center mb-4 ${
            isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
          }`}>
            <p className={`text-lg font-semibold mb-2 ${
              isCompleted ? 'text-green-900 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isCompleted ? '양도 완료!' : '취소됨'}
            </p>

            {isCompleted && !hasRated && (
              <div className="flex gap-2 justify-center mt-3 mb-3">
                <button
                  onClick={() => setShowRating(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-semibold active:bg-yellow-600"
                >
                  매너 평가
                </button>
                <button
                  onClick={() => setShowGratitude(true)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold active:bg-pink-600"
                >
                  감사 표현
                </button>
              </div>
            )}
            {isCompleted && hasRated && (
              <p className="text-xs text-gray-400 mb-2">평가 완료됨</p>
            )}

            <div className="flex gap-3 justify-center">
              <Link href="/" className="text-sm text-blue-600 dark:text-blue-400">홈으로</Link>
              {isCompleted && (
                <button onClick={() => setShowReport(true)} className="text-sm text-gray-400">신고</button>
              )}
            </div>
          </div>
        )}

        {/* 활성 상태 */}
        {!isEnded && (
          <>
            {/* 대기 상태 표시 */}
            {offer.status === 'available' && pendingRequests.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center mb-4 border border-blue-200 dark:border-blue-800">
                <div className="animate-pulse w-4 h-4 bg-blue-500 rounded-full mx-auto mb-3" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">이용자를 기다리고 있습니다</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">누군가 자리를 요청하면 알려드릴게요</p>
              </div>
            )}

            {/* 새 요청 알림 */}
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800 mb-3">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                  좌석 요청이 왔어요!
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-3">
                  누군가 이 자리로 오고 있습니다
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="flex-1 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold active:bg-purple-700"
                  >
                    수락
                  </button>
                </div>
              </div>
            ))}

            {/* 앞에 누가 서있어요 버튼 */}
            {!offer.someone_in_front && (
              <button
                onClick={handleSomeoneInFront}
                className="w-full py-3.5 bg-yellow-500 text-white rounded-xl font-semibold active:bg-yellow-600 mb-3 text-base"
              >
                앞에 누가 서있어요
              </button>
            )}

            {/* 앞에 누가 서있는 상태 */}
            {offer.someone_in_front && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800 mb-3">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-3">
                  앞에 누군가 서있습니다
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSomeoneElseSat}
                    className="flex-1 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium"
                  >
                    다른 사람이 앉았어요
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold active:bg-green-700"
                  >
                    양도 완료
                  </button>
                </div>
              </div>
            )}

            {/* 템플릿 메시지 */}
            {(acceptedRequest || offer.someone_in_front) && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">간단한 메시지 보내기</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_MESSAGES.map((msg) => (
                    <button
                      key={msg.key}
                      onClick={() => sendMessage(msg.key)}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
                    >
                      {msg.icon} {msg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 메시지 히스토리 */}
            {messages.length > 0 && (
              <div className="mt-4 space-y-2">
                {messages.map((msg) => {
                  const tmpl = TEMPLATE_MESSAGES.find(t => t.key === msg.message_key);
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className={`px-3 py-1.5 rounded-full text-xs ${
                        isMine
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {tmpl ? `${tmpl.icon} ${tmpl.label}` : msg.message_key}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 제공 취소 */}
            <button
              onClick={handleCancelOffer}
              className="w-full mt-6 py-2 text-sm text-red-500 underline"
            >
              자리 제공 취소
            </button>
          </>
        )}

        <SessionModals
          show={{ rating: showRating, report: showReport, gratitude: showGratitude }}
          offerId={offerId} user={user} offer={offer}
          counterpartProfile={counterpartProfile}
          hasRated={hasRated} setHasRated={setHasRated}
          setShowRating={setShowRating} setShowReport={setShowReport} setShowGratitude={setShowGratitude}
          showNudge={showNudge} setShowNudge={setShowNudge} dismiss={dismiss}
        />
      </div>
    );
  }

  // ========== SEEKER VIEW ==========
  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">좌석 이동 중</h1>

      {/* 좌석 정보 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {offer.line_number}호선 {offer.car_number}호차
          </span>
          <StatusBadge status={offer.status} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          좌석 {offer.seat_id} · {offer.exit_station}역 하차
        </p>
        {counterpartProfile && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400">제공자</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{counterpartProfile.nickname}</span>
            <TrustBadge profile={counterpartProfile} />
          </div>
        )}
      </div>

      {/* 종료된 경우 */}
      {isEnded && (
        <div className={`rounded-2xl p-6 text-center mb-4 ${
          isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
        }`}>
          <p className={`text-lg font-semibold mb-2 ${
            isCompleted ? 'text-green-900 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {isCompleted ? '자리를 받았어요!' : isCancelled ? '이 자리는 더 이상 이용할 수 없어요' : ''}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {isCompleted ? '좋은 이동 되세요' : '다른 사람이 먼저 앉았을 수 있습니다'}
          </p>

          {isCompleted && !hasRated && (
            <div className="flex gap-2 justify-center mb-3">
              <button
                onClick={() => setShowRating(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-semibold active:bg-yellow-600"
              >
                매너 평가
              </button>
              <button
                onClick={() => setShowGratitude(true)}
                className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold active:bg-pink-600"
              >
                감사 표현
              </button>
            </div>
          )}
          {isCompleted && hasRated && (
            <p className="text-xs text-gray-400 mb-2">평가 완료됨</p>
          )}

          <div className="flex gap-3 justify-center">
            <Link href="/seek" className="text-sm text-blue-600 dark:text-blue-400">
              {isCancelled ? '다른 자리 찾기' : '홈으로'}
            </Link>
            {isCompleted && (
              <button onClick={() => setShowReport(true)} className="text-sm text-gray-400">신고</button>
            )}
          </div>
        </div>
      )}

      {/* 활성 상태 */}
      {!isEnded && (
        <>
          {/* 요청 대기중 */}
          {myRequest?.status === 'pending' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">요청을 보냈습니다</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                제공자의 확인을 기다리고 있어요. 해당 좌석으로 이동해주세요.
              </p>
            </div>
          )}

          {/* 요청 수락됨 */}
          {myRequest?.status === 'accepted' && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800 mb-4">
              <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                요청이 수락되었어요!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                좌석 앞으로 이동해서 제공자를 확인해주세요
              </p>
            </div>
          )}

          {/* 요청 거절됨 */}
          {myRequest?.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">요청이 거절되었어요</p>
              <Link href="/seek" className="text-xs text-blue-600 dark:text-blue-400">다른 자리 찾기</Link>
            </div>
          )}

          {/* 앞에 다른 사람이 있는 경우 */}
          {offer.someone_in_front && myRequest?.status === 'pending' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800 mb-4">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                제공자 앞에 이미 누군가 있어요
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                다른 자리를 찾아보는 것을 추천합니다
              </p>
            </div>
          )}

          {/* 도착 버튼 */}
          {(myRequest?.status === 'pending' || myRequest?.status === 'accepted') && !offer.someone_in_front && (
            <button
              onClick={handleSeekerArrived}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-semibold active:bg-green-700 mb-4 text-base"
            >
              도착했어요 (제공자 앞에 서있어요)
            </button>
          )}

          {/* 템플릿 메시지 */}
          {(myRequest?.status === 'accepted' || offer.someone_in_front) && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">간단한 메시지 보내기</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_MESSAGES.map((msg) => (
                  <button
                    key={msg.key}
                    onClick={() => sendMessage(msg.key)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300"
                  >
                    {msg.icon} {msg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 히스토리 */}
          {messages.length > 0 && (
            <div className="mt-4 space-y-2">
              {messages.map((msg) => {
                const tmpl = TEMPLATE_MESSAGES.find(t => t.key === msg.message_key);
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className={`px-3 py-1.5 rounded-full text-xs ${
                      isMine
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {tmpl ? `${tmpl.icon} ${tmpl.label}` : msg.message_key}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 요청 취소 */}
          {myRequest && myRequest.status !== 'rejected' && (
            <button
              onClick={handleCancelRequest}
              className="w-full mt-6 py-2 text-sm text-red-500 underline"
            >
              요청 취소
            </button>
          )}
        </>
      )}

      <SessionModals
        show={{ rating: showRating, report: showReport, gratitude: showGratitude }}
        offerId={offerId} user={user} offer={offer}
        counterpartProfile={counterpartProfile}
        hasRated={hasRated} setHasRated={setHasRated}
        setShowRating={setShowRating} setShowReport={setShowReport} setShowGratitude={setShowGratitude}
        showNudge={showNudge} setShowNudge={setShowNudge} dismiss={dismiss}
      />
    </div>
  );
}

function SessionModals({
  show,
  offerId,
  user,
  offer,
  counterpartProfile,
  hasRated,
  setHasRated,
  setShowRating,
  setShowReport,
  setShowGratitude,
  showNudge,
  setShowNudge,
  dismiss,
}: {
  show: { rating: boolean; report: boolean; gratitude: boolean };
  offerId: string;
  user: { id: string } | null;
  offer: SeatOffer;
  counterpartProfile: Pick<Profile, 'id' | 'nickname' | 'manner_score' | 'total_provides'> | null;
  hasRated: boolean;
  setHasRated: (v: boolean) => void;
  setShowRating: (v: boolean) => void;
  setShowReport: (v: boolean) => void;
  setShowGratitude: (v: boolean) => void;
  showNudge: 'first_complete' | null;
  setShowNudge: (v: 'first_complete' | null) => void;
  dismiss: (type: 'first_complete') => void;
}) {
  if (!user) return null;
  const counterpartId = counterpartProfile?.id || offer.provider_id;

  return (
    <>
      {show.rating && (
        <MannerRatingModal
          offerId={offerId}
          ratedUserId={counterpartId}
          raterId={user.id}
          onClose={() => setShowRating(false)}
          onComplete={() => setHasRated(true)}
        />
      )}
      {show.report && (
        <ReportModal
          reporterId={user.id}
          reportedId={counterpartId}
          offerId={offerId}
          onClose={() => setShowReport(false)}
        />
      )}
      {show.gratitude && (
        <GratitudeModal
          recipientName={counterpartProfile?.nickname || '사용자'}
          onClose={() => setShowGratitude(false)}
        />
      )}
      {showNudge && (
        <LoginNudge
          type={showNudge}
          onDismiss={() => { dismiss(showNudge); setShowNudge(null); }}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400',
  };
  const labels: Record<string, string> = {
    available: '대기 중',
    reserved: '매칭됨',
    completed: '완료',
    cancelled: '취소됨',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
}
