const CACHE_NAME = "life-ledger-pwa-2.0.8";

const HAIRLINE_ASSETS = [
  "./assets/hairline/backup-restore.svg",
  "./assets/hairline/backup-success.svg",
  "./assets/hairline/calendar-empty-month.svg",
  "./assets/hairline/calendar-perfect-day.svg",
  "./assets/hairline/empty-first-run.svg",
  "./assets/hairline/empty-habits.svg",
  "./assets/hairline/empty-insights.svg",
  "./assets/hairline/empty-journal.svg",
  "./assets/hairline/empty-photos.svg",
  "./assets/hairline/empty-today-done.svg",
  "./assets/hairline/empty-week-goals.svg",
  "./assets/hairline/empty-week.svg",
  "./assets/hairline/focus-break.svg",
  "./assets/hairline/focus-cancelled.svg",
  "./assets/hairline/focus-complete.svg",
  "./assets/hairline/focus-idle.svg",
  "./assets/hairline/focus-paused.svg",
  "./assets/hairline/focus-streak.svg",
  "./assets/hairline/insights-first-week.svg",
  "./assets/hairline/journal-calendar-empty.svg",
  "./assets/hairline/journal-no-reflection.svg",
  "./assets/hairline/launcher-cloud.svg",
  "./assets/hairline/launcher-local.svg",
  "./assets/hairline/layout-edit-hint.svg",
  "./assets/hairline/offline-local.svg",
  "./assets/hairline/photos-day-empty.svg",
  "./assets/hairline/search-empty.svg",
  "./assets/hairline/sync-offline.svg",
  "./assets/hairline/today-all-scheduled-later.svg",
  "./assets/hairline/today-evening.svg",
  "./assets/hairline/today-morning.svg",
  "./assets/hairline/today-not-today.svg",
  "./assets/hairline/today-open.svg",
  "./assets/hairline/week-all-done.svg",
  "./assets/hairline/week-insights-empty.svg",
  "./assets/hairline/week-review-done.svg",
  "./assets/hairline/week-review-empty.svg",
];

const DEMO_MEMORY_ASSETS = [
  "./assets/demo-memories/analyst-desk.jpg",
  "./assets/demo-memories/run-park.jpg",
  "./assets/demo-memories/team-whiteboard.jpg",
  "./assets/demo-memories/dashboard-screen.jpg",
  "./assets/demo-memories/spree-sunset.jpg",
  "./assets/demo-memories/meetup-talk.jpg",
  "./assets/demo-memories/gym-weights.jpg",
  "./assets/demo-memories/cafe-reading.jpg",
  "./assets/demo-memories/weekend-hike.jpg",
  "./assets/demo-memories/dinner-friends.jpg",
  "./assets/demo-memories/meditation-corner.jpg",
  "./assets/demo-memories/notebook-plan.jpg",
  "./assets/demo-memories/ai-conference.jpg",
  "./assets/demo-memories/hackathon-night.jpg",
  "./assets/demo-memories/halfmarathon-medal.jpg",
  "./assets/demo-memories/team-offsite-lake.jpg",
  "./assets/demo-memories/museum-sunday.jpg",
  "./assets/demo-memories/market-haul.jpg",
  "./assets/demo-memories/birthday-dinner.jpg",
];

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=2.0.8",
  "./app.js?v=2.0.8",
  "./demo-workspace.js?v=demo10",
  "./demo-persona.js?v=10",
  "./demo-life.js?v=10",
  "./today-cards.js?v=2.0.8",
  "./today-widgets.js?v=2.0.8",
  "./weather-widget.js?v=2.0.8",
  "./vendor/widget-ui.js?v=2.0.8",
  "./vendor/widget-ui.css?v=2.0.8",
  "./today-cards.css?v=2.0.8",
  "./v202.css?v=2.0.8",
  "./hairline.js?v=2.0.8",
  "./pages-858.css?v=2.0.8",
  "./long-range.js?v=2.0.8",
  "./habit-analytics.js?v=2.0.8",
  "./interaction.js?v=2.0.8",
  "./vendor/sortable.min.js",
  "./focus-timer.js?v=2.0.8",
  "./voice-checkin.js?v=2.0.8",
  "./photo-memories.js?v=2.0.8",
  "./media-backup.js?v=2.0.8",
  "./deployment-mode.js?v=2.0.8",
  "./cloudbase-sync.js?v=2.0.8",
  "./vendor/cloudbase-sdk.js",
  "./_init_tcb-env.js?v=2.0.8",
  "./vendor/heic2any.min.js?v=0.0.4",
  "./manifest.webmanifest",
  "./assets/weekly-minimal-still-life-v2.jpg",
  "./assets/app-icon.svg",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/apple-touch-icon.png",
  ...HAIRLINE_ASSETS,
  ...DEMO_MEMORY_ASSETS,
];

const NETWORK_FIRST_SUFFIXES = [
  "/app.js",
  "/demo-workspace.js",
  "/demo-persona.js",
  "/demo-life.js",
  "/today-cards.js",
  "/today-cards.css",
  "/v202.css",
  "/pages-858.css",
  "/hairline.js",
  "/today-widgets.js",
  "/weather-widget.js",
  "/focus-timer.js",
  "/voice-checkin.js",
  "/photo-memories.js",
  "/media-backup.js",
  "/styles.css",
  "/deployment-mode.js",
  "/cloudbase-sync.js",
  "/_init_tcb-env.js",
  "/interaction.js",
  "/long-range.js",
  "/habit-analytics.js",
];

function shouldBypassFetch(url, request) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.includes("/api/")) return true;
  if (url.pathname.startsWith("/cdn-cgi/")) return true;
  return false;
}

function isManagedStaticAsset(pathname) {
  if (NETWORK_FIRST_SUFFIXES.some(suffix => pathname.endsWith(suffix))) return true;
  if (pathname.includes("/vendor/")) return true;
  if (pathname.includes("/assets/hairline/")) return true;
  if (pathname.includes("/assets/demo-memories/")) return true;
  return [
    "/manifest.webmanifest",
    "/assets/weekly-minimal-still-life-v2.jpg",
    "/assets/app-icon.svg",
    "/assets/app-icon-192.png",
    "/assets/app-icon-512.png",
    "/assets/apple-touch-icon.png",
  ].some(path => pathname.endsWith(path));
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => key.startsWith("life-ledger-") && key !== CACHE_NAME).map(key => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (shouldBypassFetch(url, request)) return;

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

  if (!isManagedStaticAsset(url.pathname)) return;

  const networkFirst = NETWORK_FIRST_SUFFIXES.some(path => url.pathname.endsWith(path));
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
