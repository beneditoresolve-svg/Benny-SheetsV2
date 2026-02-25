/* ═══════════════════════════════════════════════
   Service Worker — Benedito Resolve
   Estratégia: Cache-first para assets estáticos,
   Network-first para API calls (Sheets, Google)
═══════════════════════════════════════════════ */
const CACHE_NAME = 'benny-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
];

// Instala e cacheia assets estáticos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
});

self.addEventListener('activate', event => {
  // Remove caches antigos
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // APIs externas (Google Sheets, OAuth) → sempre rede, nunca cache
  if (url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets estáticos → cache-first, fallback rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
