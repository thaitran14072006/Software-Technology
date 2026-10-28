const SHELL = 'sag-shell-v14';
const ASSETS = ['./', './index.html', './styles.css', './app.mjs', './core.mjs', './store.mjs', './analytics.mjs', './join-qr.mjs', './admin-tools.mjs', './visitor-config.mjs', './outdoor-map.mjs', './poi-catalog.mjs', './schematic-map.mjs', './browser-tts.mjs', './ui-i18n.mjs', './ui-extra.mjs', './vendor/fonts/NotoSans.ttf', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css', './vendor/qrcode.mjs', './data/pois.json', './icon.svg', './manifest.webmanifest'];
self.addEventListener('install', event => { event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sag-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Private/admin responses and live API data are never cached by the service worker.
  if (url.origin === self.location.origin && (url.pathname.startsWith('/content-api/') || url.pathname.startsWith('/qr-api/') || url.pathname.startsWith('/demo-api/') || url.pathname === '/web-config')) return;
  if (event.request.destination === 'audio') {
    event.respondWith(caches.open('sag-audio-v1').then(async cache => (await cache.match(event.request.url)) || fetch(event.request)));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && ASSETS.some(a => new URL(a, self.registration.scope).pathname === url.pathname)) {
      const snapshot = response.clone();
      event.waitUntil(caches.open(SHELL).then(cache => cache.put(event.request, snapshot)));
    }
    return response;
  }).catch(async () => {const cache=await caches.open(SHELL);return (await cache.match(event.request,{ignoreSearch:event.request.mode==='navigate'})) || (event.request.mode==='navigate'?await cache.match('./index.html'):Response.error());}));
});
