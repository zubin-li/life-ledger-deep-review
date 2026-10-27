const CACHE_NAME = "life-ledger-pwa-2.0.3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=2.0.3",
  "./app.js?v=2.0.3",
  "./demo-workspace.js?v=demo10",
  "./demo-persona.js?v=10",
  "./demo-life.js?v=10",
  "./today-cards.js?v=2.0.3",
  "./today-widgets.js?v=2.0.3",
  "./weather-widget.js?v=2.0.3",
  "./vendor/widget-ui.js?v=2.0.3",
  "./vendor/widget-ui.css?v=2.0.3",
  "./today-cards.css?v=2.0.3",
  "./v202.css?v=2.0.3",
  "./hairline.js?v=2.0.3",
  "./pages-858.css?v=2.0.3",
  "./long-range.js?v=2.0.3",
  "./habit-analytics.js?v=2.0.3",
  "./interaction.js?v=2.0.3",
  "./vendor/sortable.min.js",
  "./focus-timer.js?v=2.0.3",
  "./voice-checkin.js?v=2.0.3",
  "./photo-memories.js?v=2.0.3",
  "./media-backup.js?v=2.0.3",
  "./deployment-mode.js?v=2.0.3",
  "./cloudbase-sync.js?v=2.0.3",
  "./vendor/cloudbase-sdk.js",
  "./_init_tcb-env.js?v=2.0.3",
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
  const activated = caches.keys().then(async keys => {
    const previousCaches = keys.filter(key => key.startsWith("life-ledger-") && key !== CACHE_NAME);
    await Promise.all(previousCaches.map(key => caches.delete(key)));
    await self.clients.claim();
    return previousCaches.length > 0;
  });
  event.waitUntil(activated);
  // Reload open windows onto the new release only AFTER activation: awaiting client.navigate() inside
  // waitUntil deadlocks (the navigation waits for this worker to finish activating) and froze upgraded pages.
  activated.then(upgraded => upgraded && self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then(windows => windows.forEach(client => client.navigate(client.url).catch(() => undefined))));
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

  const networkFirst = ["/app.js", "/demo-workspace.js", "/demo-persona.js", "/demo-life.js", "/today-cards.js", "/today-cards.css", "/v202.css", "/hairline.js", "/today-widgets.js", "/weather-widget.js", "/focus-timer.js", "/voice-checkin.js", "/photo-memories.js", "/media-backup.js", "/styles.css", "/deployment-mode.js", "/cloudbase-sync.js", "/_init_tcb-env.js"]
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
