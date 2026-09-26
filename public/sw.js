const CACHE = "infinity-store-shell-v2";
const SHELL = ["/", "/iphone", "/gio-hang", "/member"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheable = ["document", "style", "script", "image", "font"].includes(event.request.destination);
  const developmentModule = url.pathname.startsWith("/node_modules/") || url.pathname.startsWith("/@") || url.pathname.startsWith("/__debug");
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !cacheable || developmentModule || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.destination === "document" ? caches.match("/") : Response.error()))));
});
