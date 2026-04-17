'use client';

import { useState } from 'react';

interface GratitudeModalProps {
  recipientName: string;
  onClose: () => void;
}

const AMOUNTS = [100, 500, 1000];

export default function GratitudeModal({ recipientName, onClose }: GratitudeModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  function handleSend() {
    // 실제 결제 연동은 Phase 4에서 구현
    // 현재는 UI 플로우만 보여줌
    setSent(true);
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10">
          <div className="text-center py-6">
            <span className="text-4xl block mb-3">💝</span>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              감사 표현을 보냈어요!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              결제 기능은 곧 출시될 예정이에요
            </p>
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">감사 표현</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="font-medium text-gray-900 dark:text-white">{recipientName}</span>님에게 감사의 마음을 전하세요
        </p>

        <div className="flex gap-2 mb-6">
          {AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelectedAmount(amount)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                selectedAmount === amount
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {amount.toLocaleString()}원
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mb-4">
          결제 기능 준비 중 (카카오페이 / 토스페이)
        </p>

        <button
          onClick={handleSend}
          disabled={!selectedAmount}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700 active:bg-blue-700"
        >
          {selectedAmount ? `${selectedAmount.toLocaleString()}원 감사 표현 보내기` : '금액을 선택하세요'}
        </button>
      </div>
    </div>
  );
}
