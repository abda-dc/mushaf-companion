const CACHE_NAME = "mushaf-pages-v2-branding";
const asset = (path) => new URL(path, self.registration.scope).href;
const SHELL = ["./", "./index.html", "./offline.html", "./logo.png", "./favicon.ico", "./favicon-96x96.png", "./apple-touch-icon.png", "./web-app-manifest-192x192.png", "./web-app-manifest-512x512.png", "./manifest.webmanifest"].map(asset);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(asset("./offline.html"))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
