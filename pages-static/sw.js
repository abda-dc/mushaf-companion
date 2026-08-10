const CACHE_NAME = "mushaf-pages-v5-standalone-reader";
const SCOPE_PATH = "/mushaf-companion/";
const BUILD_ASSETS = /* PAGES_BUILD_ASSETS */ [];
const scopeUrl = new URL(SCOPE_PATH, self.location.origin);
const asset = (path) => new URL(path, scopeUrl).href;
const SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./offline.html",
  "./logo.png",
  "./favicon.ico",
  "./favicon-96x96.png",
  "./apple-touch-icon.png",
  "./web-app-manifest-192x192.png",
  "./web-app-manifest-512x512.png",
  "./manifest.webmanifest",
  ...BUILD_ASSETS,
].map(asset);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME && (key.startsWith("mushaf-pages-") || key.startsWith("mushaf-companion-")))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;
  if (url.pathname.startsWith(`${SCOPE_PATH}content/amharic_zain`)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(asset("./index.html"), response.clone()));
          return response;
        })
        .catch(async () => (await caches.match(asset("./index.html"))) || (await caches.match(asset("./offline.html")))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refreshed = fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached || refreshed;
    }),
  );
});
