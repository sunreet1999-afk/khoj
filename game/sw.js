// Khoj service worker. Naya version deploy karo to VERSION badlo, purana cache apne aap hat jaata hai.
const VERSION = 'khoj-v3.0.2';
const CORE = ['./', './index.html', './facts.json', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './sample/SAMPLE_nakli_restaurant_sales.csv'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Worker (AI) calls kabhi cache nahi hote.
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  // Page aur facts.json: pehle network (naya content), offline ho to cache.
  if (req.mode === 'navigate' || url.pathname.endsWith('/facts.json') || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))));
    return;
  }
  // Baaki (icons, fonts, sample): pehle cache.
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return r;
  })));
});
