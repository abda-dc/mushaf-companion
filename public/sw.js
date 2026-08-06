const CACHE_NAME = "mushaf-companion-v1";
const SHELL = ["/offline.html", "/icon.svg", "/og.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cacheKey = new Request(`${url.origin}${url.pathname}`);
            caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cacheKey = new Request(`${url.origin}${url.pathname}`);
          return (await caches.match(cacheKey)) || (await caches.match("/offline.html"));
        }),
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
