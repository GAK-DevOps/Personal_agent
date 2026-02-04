const CACHE_NAME = 'lokha-v4';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './voice-fix.js',
    './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Clearing old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch Event (Network First for better debugging)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Notification Events
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notification', body: 'New alert!' };
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});
