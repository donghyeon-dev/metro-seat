'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MannerRatingModalProps {
  offerId: string;
  ratedUserId: string;
  raterId: string;
  onClose: () => void;
  onComplete?: () => void;
}

const QUICK_COMMENTS = [
  '친절했어요',
  '빠르게 양도해줬어요',
  '자리가 깨끗했어요',
  '다음에도 이용하고 싶어요',
];

export default function MannerRatingModal({
  offerId,
  ratedUserId,
  raterId,
  onClose,
  onComplete,
}: MannerRatingModalProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (score === 0) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.from('manner_ratings').insert({
        rater_id: raterId,
        rated_id: ratedUserId,
        offer_id: offerId,
        score,
        comment: comment || null,
      });
      setDone(true);
      onComplete?.();
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 animate-slide-up">
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">평가 완료!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">소중한 평가 감사합니다</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">매너 평가</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">상대방은 어땠나요?</p>

        {/* 별점 */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className="p-1"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill={s <= score ? '#FBBF24' : 'none'}
                stroke={s <= score ? '#FBBF24' : '#D1D5DB'}
                strokeWidth="1.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>

        {/* 빠른 코멘트 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_COMMENTS.map((c) => (
            <button
              key={c}
              onClick={() => setComment(comment === c ? '' : c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                comment === c
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={score === 0 || submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700 active:bg-blue-700"
        >
          {submitting ? '제출 중...' : '평가 완료'}
        </button>
      </div>
    </div>
  );
}
