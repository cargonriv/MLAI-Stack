// Enhanced Service Worker for offline functionality and performance optimization

const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `images-v${CACHE_VERSION}`;
const API_CACHE = `api-v${CACHE_VERSION}`;

// Critical assets to cache immediately (above-the-fold content)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/avatar.png',
  '/placeholder.svg',
];

// Static assets to cache on first access
const STATIC_ASSETS = [
  '/robots.txt',
  '/404.html',
  // Add CSS and JS files (will be added dynamically)
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/models',
  '/api/blog',
  // Add other API endpoints
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Route configurations
const ROUTE_CONFIG = [
  {
    pattern: /\.(js|css)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  {
    pattern: /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: IMAGE_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
  },
  {
    pattern: /\.(html|htm)$/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
];

// Install event - cache critical assets immediately
self.addEventListener('install', (event) => {
  console.log(`Service Worker v${CACHE_VERSION} installing...`);
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets immediately
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      }),
      // Preload and cache additional static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response) : null)
              .catch(() => null) // Ignore failures for non-critical assets
          )
        );
      }),
    ])
    .then(() => {
      console.log('Service Worker installation completed');
    })
    .catch((error) => {
      console.error('Service Worker installation failed:', error);
    })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches and optimize storage
self.addEventListener('activate', (event) => {
  console.log(`Service Worker v${CACHE_VERSION} activating...`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean up expired cache entries
      cleanupExpiredCaches(),
      // Take control of all pages
      self.clients.claim(),
    ])
    .then(() => {
      console.log('Service Worker activation completed');
      // Notify clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION,
          });
        });
      });
    })
  );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (different origin) except for CDN resources
  if (url.origin !== location.origin && !isCDNResource(url)) {
    return;
  }
  
  // Find matching route configuration
  const routeConfig = findRouteConfig(url.pathname);
  
  if (routeConfig) {
    event.respondWith(handleRequest(request, routeConfig));
  } else {
    // Default strategy for unmatched routes
    event.respondWith(handleDefaultRequest(request));
  }
});

// Find matching route configuration
function findRouteConfig(pathname) {
  return ROUTE_CONFIG.find(config => config.pattern.test(pathname));
}

// Check if URL is a CDN resource we want to cache
function isCDNResource(url) {
  const cdnDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
  ];
  return cdnDomains.some(domain => url.hostname.includes(domain));
}

// Handle request based on strategy
async function handleRequest(request, config) {
  const { strategy, cache: cacheName, maxAge } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    
    default:
      return handleDefaultRequest(request);
  }
}

// Cache First strategy
async function handleCacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, addTimestamp(responseToCache));
    }
    return networkResponse;
  } catch (error) {
    // Return cached response even if expired when network fails
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Network First strategy
async function handleNetworkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, addTimestamp(responseToCache));
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html') || createOfflinePage();
    }
    
    throw error;
  }
}

// Stale While Revalidate strategy
async function handleStaleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const responseToCache = response.clone();
        cache.put(request, addTimestamp(responseToCache));
      }
      return response;
    })
    .catch(() => null);
  
  // Return cached response immediately if available and not expired
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  // Wait for network response if no valid cache
  return networkResponsePromise || cachedResponse || createErrorResponse();
}

// Default request handler
async function handleDefaultRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseToCache = networkResponse.clone();
      await cache.put(request, addTimestamp(responseToCache));
    }
    
    return networkResponse;
  } catch (error) {
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html') || createOfflinePage();
    }
    
    return createErrorResponse();
  }
}

// Add timestamp to response for expiration tracking
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;
  
  const age = Date.now() - parseInt(timestamp);
  return age > maxAge;
}

// Create offline fallback page
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - ML Portfolio</title>
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          text-align: center; 
          padding: 2rem; 
          background: #0a0a0a; 
          color: #fff; 
        }
        .offline-container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 2rem; 
        }
        .offline-icon { 
          font-size: 4rem; 
          margin-bottom: 1rem; 
        }
        .retry-btn { 
          background: linear-gradient(135deg, #8b5cf6, #a855f7); 
          color: white; 
          border: none; 
          padding: 0.75rem 1.5rem; 
          border-radius: 0.5rem; 
          cursor: pointer; 
          margin-top: 1rem; 
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Some content may not be available.</p>
        <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

// Create error response
function createErrorResponse() {
  return new Response('Service Unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Clean up expired cache entries
async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const config = findRouteConfig(new URL(request.url).pathname);
        if (config && isExpired(response, config.maxAge)) {
          await cache.delete(request);
          console.log('Deleted expired cache entry:', request.url);
        }
      }
    }
  }
}

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