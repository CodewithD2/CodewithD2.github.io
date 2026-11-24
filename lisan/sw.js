// Lisan offline support: cache first; the in-app update button refreshes the cache. build 1795515497891
const CACHE = 'lisan-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => fetch(u, { cache: 'reload' }).then(r => r.ok && c.put(u, r)).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.url.includes('version.json')) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === 'navigate' ? './' : req;
    const hit = await c.match(key, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()); return r; }
    catch { return (await c.match('./')) || Response.error(); }
  }));
});
