// Offline cache. Bump VERSION whenever index.html changes.
const VERSION = 'ledger-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Serve from cache straight away; refresh the cache in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const network = fetch(e.request).then(res => { if (res && res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    const res = await network;
    return res || (await cache.match('./index.html')) || new Response('Offline', {status: 503});
  }));
});
