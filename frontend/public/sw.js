const CACHE_NAME = 'rsu-panic-alert-v4';
const urlsToCache = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache JS, CSS, or API calls — always fetch fresh from network
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('.js') ||
    event.request.url.includes('.jsx') ||
    event.request.url.includes('.css')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else (HTML shell, images), try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'RSU Panic Alert', body: 'New alert received', url: '/dashboard' };
  try {
    data = event.data.json();
  } catch (e) {}

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'rsu-panic-alert',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.data?.url || '/dashboard');
      }
    })
  );
});