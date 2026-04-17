'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReportModalProps {
  reporterId: string;
  reportedId: string;
  offerId: string;
  onClose: () => void;
}

const REASONS = [
  { key: 'no_show', label: '약속 장소에 없었어요' },
  { key: 'fake_offer', label: '허위 등록이에요' },
  { key: 'harassment', label: '불쾌한 행동을 했어요' },
  { key: 'other', label: '기타' },
] as const;

export default function ReportModal({ reporterId, reportedId, offerId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        offer_id: offerId,
        reason,
        description: description || null,
      });
      setDone(true);
    } catch (err) {
      console.error('Report failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10">
          <div className="text-center py-6">
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">신고 접수 완료</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">검토 후 조치하겠습니다</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold">
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">신고하기</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">신고 사유를 선택해주세요</p>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setReason(r.key)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                reason === r.key
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {reason === 'other' && (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 내용을 입력해주세요"
            maxLength={200}
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={!reason || submitting}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700 active:bg-red-700"
        >
          {submitting ? '접수 중...' : '신고하기'}
        </button>
      </div>
    </div>
  );
}
