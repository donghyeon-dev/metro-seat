// Metro-Seat Service Worker
// Phase 5-3: 푸시 알림 기반 구축

const CACHE_NAME = 'metro-seat-v1';
const OFFLINE_URL = '/offline';

// 오프라인 시 캐시할 정적 리소스
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 가로채기 (Network-first 전략)
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 정상 응답은 캐시에 저장
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 서빙
        return caches.match(event.request).then((cached) => {
          return cached || new Response('오프라인입니다', { status: 503 });
        });
      })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '메트로시트', options)
  );
});

// 푸시 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      return self.clients.openWindow(url);
    })
  );
});
