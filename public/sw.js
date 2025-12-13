/// <reference lib="webworker" />

const CACHE_NAME = 'ladoum-std-v1';
const STATIC_CACHE_NAME = 'ladoum-std-static-v1';
const DYNAMIC_CACHE_NAME = 'ladoum-std-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Service worker installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external requests
    if (
        url.origin !== self.location.origin ||
        url.pathname.startsWith('/firebase') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('cloudinary.com')
    ) {
        return;
    }

    // For API calls, use network first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // For static assets, use cache first strategy
    if (
        request.destination === 'image' ||
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font'
    ) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // For navigation requests, use network first
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Default: network first
    event.respondWith(networkFirstStrategy(request));
});

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached version and update in background
        updateCache(request);
        return cachedResponse;
    }

    return fetchAndCache(request);
}

// Network first strategy - good for dynamic content
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/');
            if (offlinePage) {
                return offlinePage;
            }
        }

        throw error;
    }
}

// Fetch and cache helper
async function fetchAndCache(request) {
    const response = await fetch(request);

    if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, response.clone());
    }

    return response;
}

// Update cache in background
async function updateCache(request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response);
        }
    } catch (error) {
        // Silently fail - we already have cached version
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('[SW] Syncing data in background...');
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // TODO: Implement data sync when back online
    console.log('[SW] Data sync completed');
}

console.log('[SW] Service worker script loaded');
