'use client';

import { useState, useEffect } from 'react';

interface NotificationBannerProps {
  type: 'info' | 'success' | 'warning' | 'request';
  title: string;
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  onDismiss?: () => void;
  autoDismiss?: number;
}

const typeStyles = {
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  request: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
};

const titleStyles = {
  info: 'text-blue-900 dark:text-blue-300',
  success: 'text-green-900 dark:text-green-300',
  warning: 'text-yellow-900 dark:text-yellow-300',
  request: 'text-purple-900 dark:text-purple-300',
};

const messageStyles = {
  info: 'text-blue-700 dark:text-blue-400',
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-yellow-700 dark:text-yellow-400',
  request: 'text-purple-700 dark:text-purple-400',
};

export default function NotificationBanner({
  type,
  title,
  message,
  actions,
  onDismiss,
  autoDismiss,
}: NotificationBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  // 진동 피드백
  useEffect(() => {
    if (type === 'request' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [type]);

  if (!visible) return null;

  return (
    <div className={`rounded-2xl p-4 border ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${titleStyles[type]}`}>{title}</p>
          <p className={`text-xs mt-1 ${messageStyles[type]}`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white active:bg-blue-700'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
