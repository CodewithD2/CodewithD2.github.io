// Builds ../travel/ (the GitHub Pages app) from cards.json + app.html.  Run:  node travel-src/build.js
const fs = require('fs'), path = require('path');
const root = __dirname;
const data = JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'cards.json'), 'utf8')));
const VERSION = Date.now();
const COUNT = JSON.parse(data).reduce((n, c) => n + c.items.length, 0);
const src = fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8').replace('__DATA__', () => data).replace('__VERSION__', VERSION);
const app = src.replace('__PWA__', 'true');

const site = path.join(root, '..', 'travel');
fs.mkdirSync(site, { recursive: true });
fs.writeFileSync(path.join(site, 'index.html'),
`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1E6FD9">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="كروتي">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
${app}
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});</script>
</html>
`);
fs.writeFileSync(path.join(site, 'manifest.json'), JSON.stringify({
  name: 'كروتي في أمريكا', short_name: 'كروتي', lang: 'ar', dir: 'rtl',
  start_url: './', scope: './', display: 'standalone', background_color: '#EEF2F7', theme_color: '#1E6FD9',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
}, null, 1));
fs.writeFileSync(path.join(site, 'version.json'), JSON.stringify({ v: VERSION, count: COUNT }));
fs.writeFileSync(path.join(site, 'sw.js'),
`// Kroti offline support. Everything is served from the cache first, so the app works with no internet.
// The "download latest update" button in the app refreshes this cache; version.json is always read from the network.
// build ${VERSION}
const CACHE = 'kroti-v1';
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
  if (req.method !== 'GET') return;
  if (req.url.includes('version.json')) return; // always network
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === 'navigate' ? './' : req;
    const hit = await c.match(key, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque')) c.put(req.mode === 'navigate' ? './' : req, r.clone());
      return r;
    } catch (err) {
      return (await c.match('./')) || Response.error();
    }
  }));
});
`);
console.log('built');
