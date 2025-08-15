// Service Worker for offline functionality and error handling

const CACHE_NAME = 'ml-portfolio-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/avatar.png',
  '/placeholder.svg',
  // Add other critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (different origin)
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }
        
        // Fetch from network and cache dynamic content
        return fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                })
                .catch((error) => {
                  console.warn('Failed to cache dynamic content:', error);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.warn('Network request failed:', error);
            
            // Return offline fallback for HTML requests
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Return empty response for other requests
            return new Response('', {
              status: 408,
              statusText: 'Request Timeout (Offline)'
            });
          });
      })
  );
});

// Handle background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'retry-failed-requests') {
    event.waitUntil(retryFailedRequests());
  }
});

// Handle push notifications for error reporting
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'error-report') {
      event.waitUntil(
        self.registration.showNotification('Error Report', {
          body: data.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'error-notification'
        })
      );
    }
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE)
          .then((cache) => cache.addAll(data.urls))
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch((error) => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(DYNAMIC_CACHE)
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch((error) => {
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize()
          .then((size) => {
            event.ports[0].postMessage({ size });
          })
          .catch((error) => {
            event.ports[0].postMessage({ error: error.message });
          })
      );
      break;
  }
});

// Utility functions
async function retryFailedRequests() {
  // Implementation for retrying failed requests
  // This would typically involve reading from IndexedDB where failed requests are stored
  console.log('Retrying failed requests...');
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// Error handling for the service worker itself
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});