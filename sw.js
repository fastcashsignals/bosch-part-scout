const CACHE_NAME = 'bps-v10';
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
  const url = new URL(e.request.url);
  const isCatalog = url.pathname.endsWith('/parts.json');
  const isShell =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/bosch-part-scout/');

  // Network-first for the app shell and the parts catalog so newly added
  // parts show up on reload. Fall back to the cached copy when offline.
  if (isCatalog || isShell) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (icons, logo, part photos).
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
