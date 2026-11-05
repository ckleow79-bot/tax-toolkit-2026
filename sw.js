// Offline cache — the eight tools work after the first visit, even without signal. Live polls still need internet.
const CACHE = "tct26-v1.4.5";
// Phone precache. presenter.html, js/presenter.js and js/vendor/qrcode.js are left out (Keith's laptop only) — cached on demand if opened.
const FILES = [
"./",
"./css/app.css",
"./ds/assets/favicon-256.png",
"./ds/assets/favicon.svg",
"./ds/assets/fonts/bricolage-grotesque-400-800-latin-ext.woff2",
"./ds/assets/fonts/bricolage-grotesque-400-800-latin.woff2",
"./ds/assets/fonts/jetbrains-mono-400-latin-ext.woff2",
"./ds/assets/fonts/jetbrains-mono-400-latin.woff2",
"./ds/assets/fonts/jetbrains-mono-500-latin-ext.woff2",
"./ds/assets/fonts/jetbrains-mono-500-latin.woff2",
"./ds/assets/fonts/jetbrains-mono-700-latin-ext.woff2",
"./ds/assets/fonts/jetbrains-mono-700-latin.woff2",
"./ds/assets/fonts/public-sans-400-latin-ext.woff2",
"./ds/assets/fonts/public-sans-400-latin.woff2",
"./ds/assets/fonts/public-sans-500-latin-ext.woff2",
"./ds/assets/fonts/public-sans-500-latin.woff2",
"./ds/assets/fonts/public-sans-600-latin-ext.woff2",
"./ds/assets/fonts/public-sans-600-latin.woff2",
"./ds/assets/fonts/public-sans-700-latin-ext.woff2",
"./ds/assets/fonts/public-sans-700-latin.woff2",
"./ds/assets/fonts/public-sans-800-latin-ext.woff2",
"./ds/assets/fonts/public-sans-800-latin.woff2",
"./ds/assets/logo-white.svg",
"./ds/assets/logo.svg",
"./ds/assets/mark-white.svg",
"./ds/assets/mark.svg",
"./ds/signature.css",
"./ds/styles.css",
"./ds/tokens/colors.css",
"./ds/tokens/fonts.css",
"./ds/tokens/spacing.css",
"./ds/tokens/theme-dark.css",
"./ds/tokens/typography.css",
"./firebase-config.js",
"./index.html",
"./js/app.js",
"./js/calc.js",
"./js/firebase.js",
"./js/live.js",
"./js/polls.js",
"./js/tabs1.js",
"./js/tabs2.js",
"./js/ui.js",
"./js/vendor/LICENSE-lucide",
"./js/vendor/lucide.min.js",
"./manifest.webmanifest"
];

const CODE = /\.(html|js|css|webmanifest)$/;
const url = (f) => new URL(f, self.registration.scope).href;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
// Code files are fetched with ?v=<cache version>: a new release then always reads the new files from GitHub's origin,
// never a stale copy still held by a CDN edge (seen 5 Nov 2026: new app.js with an old ui.js = blank page).
const fresh = (u) => { const x = new URL(u); x.searchParams.set("v", CACHE); return x.href; };

// Fetch every missing file on its own (one failure no longer sinks the whole offline copy). Code files revalidate
// with the server (cheap 304 when unchanged); fonts and images use the normal HTTP cache. If the network fails, reuse
// a copy from an older cache version so a bump never leaves holes. Returns true when every file is cached.
let topping = null;
function topUp() {
  if (topping) return topping;
  topping = (async () => {
    const c = await caches.open(CACHE);
    const results = await Promise.allSettled(FILES.map(async (f) => {
      const u = url(f);
      if (await c.match(u)) return;
      try {
        const code = CODE.test(new URL(u).pathname) || u.endsWith("/");
        const r = await fetch(code ? fresh(u) : u, { cache: code ? "no-cache" : "default" });
        if (!r.ok) throw new Error(r.status);
        await c.put(u, r);
      } catch (e) {
        const old = await caches.match(u);
        if (old) await c.put(u, old.clone()); else throw e;
      }
    }));
    const done = results.every((r) => r.status === "fulfilled");
    if (done) {
      const cs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      cs.forEach((cl) => cl.postMessage({ type: "tct26-offline-ready" }));
    }
    return done;
  })().finally(() => { topping = null; });
  return topping;
}

// Install: wait up to 20 s for the precache, then activate anyway; missing files are retried on later page loads.
self.addEventListener("install", (e) => { e.waitUntil(Promise.race([topUp(), wait(20000)]).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("tct26-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// Each page load asks for a top-up (app.js); this also re-sends "offline ready" when the copy is complete.
self.addEventListener("message", (e) => { if (e.data && e.data.type === "tct26-topup") e.waitUntil(topUp()); });

// Google Fonts: the design system's fonts.css imports Noto Sans SC (Chinese) from Google. The toolkit has no Chinese
// text, and on stalling hotel Wi-Fi that render-blocking import left the page blank. Answer it locally with empty CSS.
const EMPTY_CSS = () => new Response("/* Noto Sans SC skipped offline-first: no Chinese text in this toolkit */", { headers: { "Content-Type": "text/css" } });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.hostname === "fonts.googleapis.com") { e.respondWith(EMPTY_CSS()); return; }
  if (u.hostname === "fonts.gstatic.com") { e.respondWith(new Response(null, { status: 404 })); return; }
  if (u.origin !== location.origin) return; // Firebase and other cross-origin requests go straight to the network
  const page = req.mode === "navigate" || u.pathname.endsWith(".html") || u.pathname.endsWith("/");
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = () => c.match(req, { ignoreSearch: true });
    const net = () => fetch(CODE.test(u.pathname) || page ? fresh(req.url) : req, { cache: "no-cache" }).then((r) => { if (r.ok) return c.put(req, r.clone()).then(() => r); return r; });
    if (page) {
      // Pages: network first with a 1.5 s limit, so a same-day fix reaches phones; the cached copy if slow or offline.
      const fresh = net().catch(() => null);
      e.waitUntil(fresh);
      const r = await Promise.race([fresh, wait(1500)]);
      if (r && r.ok) return r;
      const cached = (await hit()) || (await c.match(url("./index.html"))) || (await c.match(url("./")));
      return cached || (await fresh) || Response.error();
    }
    const cached = await hit();
    if (cached) {
      // Scripts and styles: cache first, refreshed in the background for the next load. Fonts and images: cache first.
      if (CODE.test(u.pathname)) e.waitUntil(net().catch(() => {}));
      return cached;
    }
    return net();
  })());
});
