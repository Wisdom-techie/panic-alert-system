const CACHE_NAME = 'rsu-panic-alert-v2'; // bumped version forces cache refresh
const urlsToCache = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim()) // take control of open pages immediately
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache API calls or JS/CSS module files - always fetch fresh
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('.js') ||
    event.request.url.includes('.jsx')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});