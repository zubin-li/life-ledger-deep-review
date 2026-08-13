const CACHE_NAME = "life-ledger-pwa-0.2.5-habit-schedule-toolbar";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=0.2.5",
  "./app.js?v=0.2.5",
  "./deployment-mode.js?v=0.2.5",
  "./cloudbase-sync.js?v=0.2.5",
  "./vendor/cloudbase-sdk.js",
  "./_init_tcb-env.js?v=0.2.5",
  "./manifest.webmanifest",
  "./assets/weekly-minimal-still-life-v2.jpg",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      const previousCaches = keys.filter(key => key.startsWith("life-ledger-") && key !== CACHE_NAME);
      await Promise.all(previousCaches.map(key => caches.delete(key)));
      await self.clients.claim();
      if (!previousCaches.length) return;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(windows.map(client => client.navigate(client.url).catch(() => undefined)));
    })
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const contentType = response.headers.get("content-type") || "";
          if (response.ok && contentType.includes("text/html") && !response.redirected) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match("./index.html")) || caches.match("./"))
    );
    return;
  }

  const networkFirst = ["/app.js", "/styles.css", "/deployment-mode.js", "/cloudbase-sync.js", "/_init_tcb-env.js"]
    .some(path => url.pathname.endsWith(path));
  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fresh = fetch(request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
      });
      return cached || fresh;
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      const existing = openClients.find(client => new URL(client.url).origin === self.location.origin);
      if (existing) return existing.focus();
      return clients.openWindow("./?source=notification&view=today");
    })
  );
});
