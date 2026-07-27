/* ELC Portal service worker: offline shell, fetch policy by request class.
   0) navigation (HTML docs) : network-first, cached shell as offline fallback. A
      returning viewer online never opens a stale shell (0061); the cache is the
      offline safety net only.
   1) assets/fonts/  : cache-first, no revalidation (content-hashed URLs, immutable).
   2) assets/data.js : network-first, cache fallback (the freshness point).
   3) other same-origin GET : stale-while-revalidate (cached copy answers now, a
      background cache:'reload' fetch updates the cache for the next load).
   CACHE bump rule: routine asset edits need NO bump (SWR picks them up); HTML-to-JS
   contract changes DO need one (stale HTML + fresh JS is a real mixed-version risk
   under SWR).
   All URLs are relative to this script, so the site works at / or /portal-test/. */
const CACHE = "elc-portal-shell-v24";

const SHELL = [
  "./",
  "activities/",
  "calendar/",
  "policies/",
  "asa/",
  "community/",
  "community/giving/",
  "help/",
  "new-families/",
  "new-family-orientation/",
  "what-happens-next/",
  "status/",
  "privacy/",
  "safeguarding/",
  "verify/",
  "glossary/",
  "hopes-and-wishes/",
  "coffee-mornings/",
  "policies/photo-consent/",
  "arrival/",
  "nuts-and-bolts/",
  "how-to-pay/",
  "sport/",
  "armonia/",
  "armonia/drama/",
  "armonia/music/",
  "armonia/expressive-languages/",
  "armonia/science/",
  "armonia/technology/",
  "armonia/sport/",
  "gate-card/",
  "purple-elephant/thong-lor/",
  "purple-elephant/thong-lor/nuts-and-bolts/",
  "purple-elephant/thong-lor/new-families/",
  "purple-elephant/thong-lor/faq/",
  "purple-elephant/thong-lor/policies/",
  "purple-elephant/samakee/",
  "purple-elephant/samakee/nuts-and-bolts/",
  "purple-elephant/samakee/new-families/",
  "purple-elephant/samakee/faq/",
  "purple-elephant/samakee/policies/",
  "calendar/print/",
  "purple-elephant/thong-lor/print/",
  "purple-elephant/samakee/print/",
  "manifest.json",
  "assets/tokens.css",
  "assets/app.css",
  "assets/print.css",
  "assets/fonts.css",
  "assets/data.js",
  "assets/doc-page.js",
  "assets/render.js",
  "assets/contour.js",
  "assets/feedback.js",
  "assets/install.js",
  "assets/icon.svg",
  "assets/img/icons.svg",
  "assets/img/elc-logo.svg",
  "assets/img/cityschool-mark.png",
  "assets/img/elephant-mark.png",
  "assets/img/art/welcome.svg",
  "assets/img/art/thai-houses.svg",
  "assets/img/art/spiral.png",
  "assets/icon-180.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/img/hos.png",
  "assets/img/trevor.png",
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
  // Delete only OUR old caches (elc-portal-*): the caches API is origin-wide, and
  // an unscoped delete would evict a sibling deployment's caches on a shared
  // origin (plan 2026-07-16 item 1.7).
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.indexOf("elc-portal-") === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  /* Tier 0: the calendar feed (api/v1/*.ics + api/v1/*.json) is a live-data path:
     network-only, never cached. A subscribing calendar client polls it server-side
     and bypasses the SW entirely; this guard is for a browser-opened feed URL, so a
     stale cached snapshot is never served in place of the current dates (P4 pass A). */
  if (url.pathname.indexOf("/api/") !== -1) return;

  /* Tier 0: navigation (HTML documents): network-first. This kills first-open-stale
     online (0061): every navigation serves fresh HTML, and the cached shell answers
     only when the network is gone. Refresh the cache on each successful nav so the
     offline fallback stays current. */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./"))
        )
    );
    return;
  }

  /* Tier 1: content-hashed fonts never change: cache first, no revalidation. */
  if (url.pathname.indexOf("/assets/fonts/") !== -1) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))
    );
    return;
  }

  /* Tier 2: data.js is the freshness point: network first, cached copy when offline. */
  if (url.pathname.endsWith("/assets/data.js")) {
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

  /* Tier 3: everything else: stale-while-revalidate. The cached copy answers now;
     the revalidation fetch uses cache:'reload' so it bypasses the HTTP cache
     (GitHub Pages serves max-age=600) and lands a truly fresh copy for next load.
     Cache miss goes straight to network and caches the response. */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const refresh = fetch(new Request(req, { cache: "reload" })).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
      if (hit) {
        e.waitUntil(refresh.catch(() => {}));
        return hit;
      }
      return refresh;
    })
  );
});
