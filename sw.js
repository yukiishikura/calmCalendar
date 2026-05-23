const CACHE_NAME = 'calm-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/assets/logo.png'
];

// インストール時に静的ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時に古いキャッシュをクリーンアップ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト発生時にキャッシュから返却（Cache First、失敗時はネットワーク）
self.addEventListener('fetch', event => {
  // APIリクエスト（/api/で始まるもの）やGET以外のメソッドはキャッシュせずバイパスする
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return; // Service Workerは干渉せずネットワークに直接パスする
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // キャッシュヒット
        }
        return fetch(event.request).then(networkResponse => {
          // レスポンスが正常な場合のみキャッシュに追加（任意）
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック処理（必要なら）
      })
  );
});
