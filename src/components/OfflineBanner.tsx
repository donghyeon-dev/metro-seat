'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white text-center py-2 text-sm font-medium">
      오프라인 상태입니다. 인터넷 연결을 확인해주세요.
    </div>
  );
}
