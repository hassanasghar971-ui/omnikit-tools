/* OmniKit Tools — offline-first service worker.
 * Navigation: network-first with cached fallback (instant offline reloads).
 * Static assets: cache-first, versioned by build hash in the cache name. */
"use strict";

const CACHE = "omnikit-shell-v4";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/manifest.webmanifest", "/icon.svg", "/offline"]).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API endpoints: network only
  if (url.pathname.startsWith("/api/")) return;

  // Static hashed assets: cache-first
  if (url.pathname.startsWith("/_next/static/") || /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ??
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations: network-first, cache fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached ?? caches.match("/offline").then((off) => off ?? new Response("You are offline.", { headers: { "Content-Type": "text/plain" } }))),
        ),
    );
    return;
  }

  // Remaining same-origin GETs: cache-first with graceful pass-through —
  // offline requests for previously cached payloads keep working.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ??
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached),
    ),
  );
});
