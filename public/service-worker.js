// public/service-worker.js

const CACHE_NAME = 'dgtl-digicard-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // add any other static files you want pre-cached here
];

/**
 * Helper: only cache same-origin http(s) GET requests
 */
function isCacheableRequest(req) {
  try {
    if (req.method !== 'GET') return false;
    const url = new URL(req.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    // allow same-origin
    if (url.origin === self.location.origin) return true;

    // allow cross-origin images from firebase storage
    if (req.destination === 'image' && url.hostname === 'firebasestorage.googleapis.com') return true;

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * INSTALL - pre-cache assets
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

/**
 * ACTIVATE - claim clients and clean old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // claim control immediately
      if (self.clients && typeof self.clients.claim === 'function') {
        await self.clients.claim();
      }

      // remove old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })()
  );
});

/**
 * FETCH - strategy:
 * - Navigation (HTML): network-first, fallback to cache (and cached '/')
 * - Static assets (same-origin GET): cache-first, then network and cache
 * - Ignore non-http(s) and cross-origin requests to avoid errors (e.g. chrome-extension://)
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GETs
  if (req.method !== 'GET') return;

  // Protect against weird or unsupported schemes (chrome-extension:, about:, moz-extension:, etc.)
  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return; // malformed URL — ignore
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // NAVIGATION (HTML) => network-first
  const acceptsHtml = (req.headers.get('accept') || '').includes('text/html');
  if (req.mode === 'navigate' || acceptsHtml) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          // cache navigation responses if same-origin and status ok
          if (isCacheableRequest(req) && networkResponse && networkResponse.ok) {
            try {
              const copy = networkResponse.clone();
              const cache = await caches.open(CACHE_NAME);
              await cache.put(req, copy).catch((err) => {
                // swallow cache.put errors to avoid unhandled rejections
                console.warn('Failed to cache navigation response:', err);
              });
            } catch (err) {
              console.warn('Navigation cache error:', err);
            }
          }
          return networkResponse;
        } catch (err) {
          // network failed → try cache fallback
          const cached = await caches.match(req);
          if (cached) return cached;
          // fallback to root (index) if available
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          // else propagate the original error (browser will show network error)
          throw err;
        }
      })()
    );
    return;
  }

  // OTHER ASSETS -> cache-first, then network -> cache result
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(req);
      if (cachedResponse) return cachedResponse;

      try {
        const networkResponse = await fetch(req);

        // only attempt to cache same-origin, successful, non-opaque responses
        if (isCacheableRequest(req) && networkResponse && networkResponse.ok && networkResponse.type !== 'opaque') {
          try {
            const copy = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(req, copy).catch((err) => {
              console.warn('Failed to cache resource:', req.url, err);
            });
          } catch (err) {
            console.warn('Cache put error:', err);
          }
        }

        return networkResponse;
      } catch (err) {
        // network failed: if it's an image, return a cached placeholder if available
        if (req.destination === 'image') {
          const fallbackImg = await caches.match('/icons/icon-192x192.png');
          if (fallbackImg) return fallbackImg;
        }
        // try to return any cache match as last resort
        const fallback = await caches.match(req);
        if (fallback) return fallback;
        // otherwise rethrow to let browser handle it
        throw err;
      }
    })()
  );
});
