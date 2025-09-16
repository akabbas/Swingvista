// Service Worker for SwingVista Offline Capability
const CACHE_NAME = 'swingvista-v1';
const STATIC_ASSETS = [
  '/',
  '/camera',
  '/upload',
  '/manifest.json',
  '/globals.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for dynamic content, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests (CDN, MediaPipe, etc.)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Cache-first strategy for static assets
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
            return response;
          });
        })
        .catch(() => {
          // Fallback for offline
          if (request.url.includes('/camera')) {
            return new Response(`
              <html>
                <head><title>SwingVista - Offline</title></head>
                <body>
                  <h1>SwingVista Camera</h1>
                  <p>You're currently offline. The camera analysis will be available once you're back online.</p>
                  <p>Your recorded swings are saved locally and will sync when reconnected.</p>
                </body>
              </html>
            `, { headers: { 'Content-Type': 'text/html' } });
          }
        })
    );
    return;
  }
  
  // Network-first strategy for API calls and dynamic content
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(request).then((response) => {
          return response || new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Message handling for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});