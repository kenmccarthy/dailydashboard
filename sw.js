// ── SW.JS ──
// Minimal service worker: cache-first for this site's own static files (the
// "shell"), network-only for everything else (third-party APIs — weather,
// flight, news, etc. — must never be served stale). Bump CACHE_NAME whenever
// a shell file changes, since there's no build step to do that automatically.
const CACHE_NAME = 'dd-shell-v1';

const SHELL_FILES = [
  '.',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/app.js',
  'js/cards.js',
  'js/dom-utils.js',
  'js/weather.js',
  'js/airquality.js',
  'js/flight.js',
  'js/f1.js',
  'js/rugby.js',
  'js/tides.js',
  'js/space.js',
  'js/lastfm.js',
  'js/uk1s.js',
  'js/special.js',
  'js/setup.js',
  'data/quotes.json',
  'data/facts.json',
  'data/music_facts.json',
  'data/songs_80s.json',
  'data/irish_words.json',
  'data/proverbs.json',
  'data/saints.json',
  'data/un_days.json',
  'data/airlines.json',
  'data/uk_number_ones.json',
  'img/favicon.svg',
  'img/favicon-32x32.png',
  'img/favicon-16x16.png',
  'img/favicon.ico',
  'img/apple-touch-icon.png',
  'img/android-chrome-192x192.png',
  'img/android-chrome-512x512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;   // third-party APIs — always network
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return res;
      })
    )
  );
});
