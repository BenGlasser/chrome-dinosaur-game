//service worker — precaches game assets so the PWA works offline
//bump CACHE_VERSION any time an asset changes; the activate handler purges old caches
const CACHE_VERSION = "dino-v1";

const ASSETS = [
    "./",
    "./index.html",
    "./dino.css",
    "./dino.js",
    "./manifest.webmanifest",
    "./img/dino.png",
    "./img/dino-run1.png",
    "./img/dino-run2.png",
    "./img/dino-jump.png",
    "./img/dino-duck1.png",
    "./img/dino-duck2.png",
    "./img/dino-dead.png",
    "./img/cactus1.png",
    "./img/cactus2.png",
    "./img/cactus3.png",
    "./img/bird1.png",
    "./img/bird2.png",
    "./img/track.png"
];

self.addEventListener("install", function(e) {
    e.waitUntil(caches.open(CACHE_VERSION).then(function(cache) {
        return cache.addAll(ASSETS);
    }));
    self.skipWaiting(); //activate the new SW immediately on install
});

self.addEventListener("activate", function(e) {
    e.waitUntil(caches.keys().then(function(keys) {
        return Promise.all(keys.filter(function(k) {
            return k !== CACHE_VERSION;
        }).map(function(k) {
            return caches.delete(k);
        }));
    }));
    self.clients.claim(); //take over open tabs without a reload
});

self.addEventListener("fetch", function(e) {
    //cache-first: serve cached asset if available, otherwise hit the network
    e.respondWith(caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request);
    }));
});
