importScripts("./offline-assets.js");

const CACHE = `buzzer-${self.OFFLINE_VERSION}`;

/*
 * Le migliaia di volti NON devono bloccare l'installazione
 * di una nuova versione della PWA.
 *
 * La shell viene precacheata.
 * I volti entrano nella stessa cache solo quando vengono usati.
 */
const SHELL_ASSETS = self.OFFLINE_ASSETS.filter(
  (asset) => !asset.includes("../../assets/volti/")
);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    for (let i = 0; i < SHELL_ASSETS.length; i += 50) {
      await cache.addAll(SHELL_ASSETS.slice(i, i + 50));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("buzzer-")
              && key !== CACHE
          )
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({
      version: self.OFFLINE_VERSION,
    });
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  const isPlayerFace =
    url.pathname.includes("/assets/volti/");

  if (isPlayerFace) {
    /*
     * Cache on demand:
     * il primo utilizzo va in rete, poi resta disponibile offline.
     */
    event.respondWith((async () => {
      const cached = await caches.match(event.request);

      if (cached) return cached;

      try {
        const response = await fetch(event.request);

        if (response?.ok) {
          const cache = await caches.open(CACHE);
          cache.put(event.request, response.clone());
        }

        return response;
      } catch {
        return Response.error();
      }
    })());

    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached
        || (
          event.request.mode === "navigate"
            ? caches.match("./index.html")
            : fetch(event.request)
        )
    )
  );
});
