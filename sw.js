// Smart cache strategy without version numbers
const CACHE_NAME = 'area-calc-dynamic';
const STATIC_CACHE_NAME = 'area-calc-static';

// Static assets that rarely change
const STATIC_ASSETS = [
  'manifest.json',
  'icon.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap'
];

// Dynamic assets that may change frequently
const DYNAMIC_ASSETS = [
  './',
  'index.html',
  'cyclicQuadrilateral.html',
  'divide_area.html',
  'irregular_quadrilateral.html',
  'saved_results.html',
  'trapezoid.html',
  'trapezoid_height_division.html',
  'triangle.html',
  'calculator.html',
  'mini-calculator.js',
  'reset-button.js',
  'main_screen.html',
  'login.html',
  'profile.html',
  'firebase-config.js',
  'firebase-logic.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Claim clients immediately
  self.clients.claim();
});

// Fetch event - Network First with cache update
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle dynamic assets (HTML, JS, CSS)
  if (DYNAMIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response immediately
          const responseToCache = response.clone();
          
          // Update cache with fresh version
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, try static cache
            return caches.match(request, { cacheName: STATIC_CACHE_NAME });
          });
        })
    );
  } else {
    // For other assets, use cache first
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background for next time
          fetch(request).then((response) => {
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          }).catch(() => {}); // Ignore network errors for background updates
          
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          // Cache the response
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        }).catch(() => {
            // Handle offline case for non-cached assets
            return new Response('Offline content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' })
            });
        });
      })
    );
  }
});

// Message event to handle manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});