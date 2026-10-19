/* SmartGuide service worker: offline support for the visitor site. Admin and private APIs are never cached. */
const VERSION = "sg-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll([OFFLINE_URL, "/explore"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isVisitorPage(url) {
  return url.pathname === "/explore" || url.pathname === "/favorites" || url.pathname.startsWith("/a/") || url.pathname.startsWith("/tours");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || req.headers.has("range")) return;

  // Uploaded media + hashed Vite build assets: cache first
  if (url.pathname.startsWith("/api/v1/files/") || url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.status === 200) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Public read APIs: network first, fall back to cache
  if (url.pathname.startsWith("/api/v1/public/") && !url.pathname.endsWith("/scan")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(PAGES).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || Response.error()))
    );
    return;
  }

  // Visitor pages: network first, cached copy or offline page when there is no signal
  if (req.mode === "navigate" && isVisitorPage(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(PAGES).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL)))
    );
  }
});
