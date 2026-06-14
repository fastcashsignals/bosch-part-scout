const CACHE_NAME = 'bps-v5';
const ASSETS = [
  '/bosch-part-scout/',
  '/bosch-part-scout/index.html',
  '/bosch-part-scout/parts.json',
  '/bosch-part-scout/manifest.json',
  '/bosch-part-scout/logo.jpg',
  '/bosch-part-scout/icon-192.png',
  '/bosch-part-scout/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => {
        if (e.request.destination === 'image') {
          return new Response('', { status: 204 });
        }
      });
    })
  );
});
