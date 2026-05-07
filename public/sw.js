const CACHE_PREFIX = 'scholarbridge-';
const CACHE_NAME = 'scholarbridge-v3-network-only';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Intentionally no fetch handler. The app remains installable as a PWA,
// but every request requires the network and auth redirects are untouched.
