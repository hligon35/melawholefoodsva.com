/*
  Minimal service worker for offline resilience.
  - Cache-first for static assets (CSS, JS, images).
  - Network-first for HTML; fall back to /404.html when offline.
*/

const CACHE_NAME = 'mwf-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/annual-reports.html',
  '/food-safety.html',
  '/partners.html',
  '/privacy-policy.html',
  '/styles.min.css?v=20260508',
  '/styles.home.min.css?v=20260508',
  '/script.min.js?v=20260508',
  '/site.webmanifest',
  '/images/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    return;
  }

  // For navigation requests (HTML), try network first, then cache, then 404 fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Optionally update cache
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/404.html')))
    );
    return;
  }

  // For same-origin static assets, use cache-first
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached || fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        }).catch(() => cached)
      )
    );
  }
});
