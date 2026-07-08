/* ELC Portal service worker: offline shell, cache-first.
   All URLs are relative to this script, so the site works at / or /portal-test/. */
const CACHE = "elc-portal-shell-v5";

const SHELL = [
  "./",
  "activities/",
  "calendar/",
  "policies/",
  "asa/",
  "manifest.json",
  "assets/tokens.css",
  "assets/app.css",
  "assets/fonts.css",
  "assets/data.js",
  "assets/render.js",
  "assets/contour.js",
  "assets/feedback.js",
  "assets/icon.svg",
  "assets/icon-180.png",
  "assets/icon-512.png",
  "assets/img/hos.png",
  "assets/img/photo-propeller-girl.jpg",
  "assets/fonts/hanken-grotesk-normal-7579623a.woff2",
  "assets/fonts/hanken-grotesk-normal-c95efb87.woff2",
  "assets/fonts/inter-tight-normal-17cab155.woff2",
  "assets/fonts/inter-tight-normal-a807ee01.woff2",
  "assets/fonts/newsreader-italic-0ea71c37.woff2",
  "assets/fonts/newsreader-italic-c6ccfc69.woff2",
  "assets/fonts/newsreader-normal-4aa9bb70.woff2",
  "assets/fonts/newsreader-normal-997f7492.woff2",
  "assets/fonts/saira-stencil-one-normal-3e238e76.woff2",
  "assets/fonts/saira-stencil-one-normal-7d6d2bdf.woff2",
  "assets/fonts/space-mono-normal-45cbe05a.woff2",
  "assets/fonts/space-mono-normal-5ddd4a62.woff2",
  "assets/fonts/space-mono-normal-a32e02d8.woff2",
  "assets/fonts/space-mono-normal-a92bcf81.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  /* data.js is the freshness point: network first, cached copy when offline. */
  if (new URL(req.url).pathname.endsWith("/assets/data.js")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (!res.ok) return caches.match(req).then((hit) => hit || res);
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* Everything else: cache first, network fallback. */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))
  );
});
