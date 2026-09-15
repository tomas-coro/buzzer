importScripts("./offline-assets.js");

const CACHE = `buzzer-${self.OFFLINE_VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < self.OFFLINE_ASSETS.length; i += 50) {
      await cache.addAll(self.OFFLINE_ASSETS.slice(i, i + 50));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("buzzer-") && key !== CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ version: self.OFFLINE_VERSION });
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached
    || (event.request.mode === "navigate" ? caches.match("./index.html") : fetch(event.request))));
});
