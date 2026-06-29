const CACHE_NAME = 'rincon-casero-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'gallery.html',
  'css/style.css',
  'img/Logo.webp',
  'img/Pan-Blanco_Horizontal.webp',
  'img/Pan-Blanco_Horizontal-600.webp',
  'img/Pan-Blanco_Horizontal-800.webp',
  'img/Chipa.webp',
  'img/Chipa-400.webp',
  'img/Pan-Blanco.webp',
  'img/Pan-Blanco-400.webp',
  'img/Pan_con_Semillas.webp',
  'img/Pan_con_Semillas-400.webp',
  'img/Cookies.webp',
  'img/Cookies-400.webp',
  'img/Scones.webp',
  'img/Scones-400.webp',
  'img/Pan_con_toppings.webp',
  'img/Pan_con_toppings-400.webp',
  'img/favicon.svg',
  'img/Path 0.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    requestUrl.pathname.match(/\.(webp|png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
