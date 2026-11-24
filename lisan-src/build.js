// Builds ../lisan/ (GitHub Pages app, works offline) from data/*.json + app.html.  Run:  node lisan-src/build.js
// Optional: node lisan-src/build.js --preview <file>  → also writes a single-file preview without offline support.
const fs = require('fs'), path = require('path');
const root = __dirname, site = path.join(root, '..', 'lisan');
const LANGS = {};
for (const f of fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.json')).sort()) {
  const L = JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
  // every word in every text must have a meaning
  L.texts.forEach(t => t.s.forEach(([s]) => (s.match(/\p{L}+/gu) || []).forEach(w => {
    if (!(w.toLowerCase() in t.v)) throw new Error(`${f}: "${t.title}" has no meaning for "${w}"`);
  })));
  LANGS[L.code] = L;
}
const VERSION = Date.now();
const src = fs.readFileSync(path.join(root, 'app.html'), 'utf8').replace('__LANGS__', () => JSON.stringify(LANGS)).replace('__VERSION__', VERSION);
const pi = process.argv.indexOf('--preview');
if (pi > 0) fs.writeFileSync(process.argv[pi + 1], src.replace('__PWA__', 'false'));
const app = src.replace('__PWA__', 'true');
fs.mkdirSync(site, { recursive: true });
fs.writeFileSync(path.join(site, 'index.html'), `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#5B3FD6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="لسان">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
${app}
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});</script>
</html>
`);
fs.writeFileSync(path.join(site, 'manifest.json'), JSON.stringify({
  name: 'لسان — تعلّم اللغات', short_name: 'لسان', lang: 'ar', dir: 'rtl', start_url: './', scope: './', display: 'standalone',
  background_color: '#EFF2F7', theme_color: '#5B3FD6',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
}, null, 1));
fs.writeFileSync(path.join(site, 'version.json'), JSON.stringify({ v: VERSION }));
fs.writeFileSync(path.join(site, 'sw.js'), `// Lisan offline support: cache first; the in-app update button refreshes the cache. build ${VERSION}
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
`);
console.log('built', Object.keys(LANGS).join(','), VERSION);
