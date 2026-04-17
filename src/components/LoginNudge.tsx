'use client';

import { useState, useEffect } from 'react';

interface LoginNudgeProps {
  type: 'first_complete' | 'frequent_user' | 'gratitude_received';
  onDismiss: () => void;
}

const NUDGE_CONFIG = {
  first_complete: {
    title: '첫 양도 성공!',
    message: '계정을 만들면 매너 점수가 쌓이고 다른 사용자에게 신뢰를 줄 수 있어요.',
    cta: '계정 만들기',
    icon: '🎉',
  },
  frequent_user: {
    title: '자주 쓰시네요!',
    message: '경로를 저장하면 매번 입력하지 않아도 돼요.',
    cta: '경로 저장하기',
    icon: '⚡',
  },
  gratitude_received: {
    title: '감사 인사가 도착했어요',
    message: '누군가 감사 표현을 보냈어요. 확인하려면 계정이 필요해요.',
    cta: '확인하기',
    icon: '💝',
  },
};

const NUDGE_STORAGE_KEY = 'metro-seat:nudge-dismissed';

export function useNudge() {
  function shouldShow(type: LoginNudgeProps['type']): boolean {
    try {
      const dismissed = JSON.parse(localStorage.getItem(NUDGE_STORAGE_KEY) || '{}');
      return !dismissed[type];
    } catch { return true; }
  }

  function dismiss(type: LoginNudgeProps['type']) {
    try {
      const dismissed = JSON.parse(localStorage.getItem(NUDGE_STORAGE_KEY) || '{}');
      dismissed[type] = Date.now();
      localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(dismissed));
    } catch {}
  }

  function getCompletionCount(): number {
    try {
      return parseInt(localStorage.getItem('metro-seat:completion-count') || '0', 10);
    } catch { return 0; }
  }

  function incrementCompletion(): number {
    try {
      const count = getCompletionCount() + 1;
      localStorage.setItem('metro-seat:completion-count', String(count));
      return count;
    } catch { return 0; }
  }

  return { shouldShow, dismiss, getCompletionCount, incrementCompletion };
}

export default function LoginNudge({ type, onDismiss }: LoginNudgeProps) {
  const config = NUDGE_CONFIG[type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 200);
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${
      visible ? 'bg-black/40' : 'bg-transparent pointer-events-none'
    }`}>
      <div className={`w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6 pb-10 transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="text-center mb-4">
          <span className="text-4xl mb-2 block">{config.icon}</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{config.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.message}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700"
          >
            {config.cta}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-gray-400"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
