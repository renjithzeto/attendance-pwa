const CACHE_NAME = 'attendance-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle normal requests; minimal pass-through for PWA installability
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
