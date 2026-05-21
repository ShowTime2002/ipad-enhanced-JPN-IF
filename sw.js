const CACHE_NAME = 'jpn-input-v9';
const STATIC_ASSETS = ['./manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const accept = event.request.headers.get('accept') || '';

  // index.html は常にネットワーク優先（オフライン時のみキャッシュ使用）
  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 静的アセットはキャッシュ優先
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
