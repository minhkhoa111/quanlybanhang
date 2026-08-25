const CACHE = "huy-apple-shell-v1";
const SHELL = ["/", "/iphone", "/gio-hang", "/tai-khoan", "/huy-apple-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheable = ["document", "style", "script", "image", "font"].includes(event.request.destination);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !cacheable || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.destination === "document" ? caches.match("/") : Response.error()))));
});
