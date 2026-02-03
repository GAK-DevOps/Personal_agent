const CACHE_NAME = 'lokha-v1';
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

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch Event (Offline Support)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Notification Close Event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Background Push (Placeholder for future real push)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notification', body: 'New alert!' };
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});
