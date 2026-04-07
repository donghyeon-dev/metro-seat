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
  autoDismiss?: number; // ms
}

const typeStyles = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  request: 'bg-purple-50 border-purple-200',
};

const titleStyles = {
  info: 'text-blue-900',
  success: 'text-green-900',
  warning: 'text-yellow-900',
  request: 'text-purple-900',
};

const messageStyles = {
  info: 'text-blue-700',
  success: 'text-green-700',
  warning: 'text-yellow-700',
  request: 'text-purple-700',
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

  if (!visible) return null;

  return (
    <div
      className={`rounded-2xl p-4 border animate-in slide-in-from-top ${typeStyles[type]}`}
    >
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
            className="text-gray-400 hover:text-gray-600 ml-2"
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
                  : 'bg-white text-gray-700 border border-gray-200'
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
