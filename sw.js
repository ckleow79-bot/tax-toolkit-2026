// Offline cache — the eight tools work after the first visit, even without signal. Live polls still need internet.
const CACHE = "tct26-v1.1";
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
"./js/presenter.js",
"./js/tabs1.js",
"./js/tabs2.js",
"./js/ui.js",
"./js/vendor/LICENSE-lucide",
"./js/vendor/lucide.min.js",
"./js/vendor/qrcode.js",
"./manifest.webmanifest",
"./presenter.html"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Firebase and fonts go to the network
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net; // stale-while-revalidate: fast and offline-safe; updates arrive on the next load
  }));
});
