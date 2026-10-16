// Bump VERSION whenever you upload a new index.html so phones pick up the update.
const VERSION = "tau-sheets-v7";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  // cache:"reload" skips the browser's HTTP cache so a new version never stores an old copy.
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Page itself: always fetch fresh from GitHub (no-store bypasses GitHub's 10-minute cache);
  // fall back to the saved copy when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req.url, { cache: "no-store" }).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put("./index.html", c)); }
      return r;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  // Everything else (icons, Google Fonts): cache first, fill cache on first load.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r;
    })));
  }
});
