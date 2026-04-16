'use client';

import type { Profile } from '@/types';

interface TrustBadgeProps {
  profile: Pick<Profile, 'manner_score' | 'total_provides' | 'nickname'> | null;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ profile, size = 'sm' }: TrustBadgeProps) {
  if (!profile || profile.total_provides === 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      }`}>
        신규
      </span>
    );
  }

  const score = profile.manner_score ?? 3.0;
  const color = score >= 4.0
    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    : score >= 3.0
    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${color} ${
      size === 'sm' ? 'text-[10px]' : 'text-xs'
    }`}>
      <StarIcon size={size === 'sm' ? 10 : 12} />
      {score.toFixed(1)} · {profile.total_provides}회
    </span>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
