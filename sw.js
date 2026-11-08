/* LIFE — service worker
 *
 * Bump VERSION on every deploy. The old cache is deleted on activate, so a
 * stale app.js can never outlive a release. Keep it in step with the ?v= query
 * on the <script>/<link> tags in index.html.
 */
const VERSION = '3.2.0';
const CACHE = 'life-rpg-' + VERSION;

// The app shell. Everything here must exist, or install fails and the old
// worker stays in charge — which is the safe outcome.
// The versioned entries must match the ?v= the page actually requests, or the
// precache is dead weight and the first offline load falls through to network.
const SHELL = [
  './',
  './index.html',
  './styles.css?v=' + VERSION,
  './brutalist.css?v=' + VERSION,
  './app.js?v=' + VERSION,
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('life-rpg-') && k !== CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Let the page trigger an immediate takeover after it prompts the user.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function isCacheable(res) {
  // 'opaque' responses (no-cors, e.g. fonts) are cacheable but their status
  // reads as 0, so allow those explicitly and reject genuine errors.
  return res && (res.ok || res.type === 'opaque');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigations: try the network so a deploy is picked up immediately, fall
  // back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (isCacheable(res)) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Everything else: serve from cache instantly, refresh in the background.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (isCacheable(res)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
