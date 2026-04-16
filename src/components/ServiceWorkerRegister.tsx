'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';

export default function ServiceWorkerRegister() {
  useServiceWorker();
  return null;
}
