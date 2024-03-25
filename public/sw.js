self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("v1").then(function (cache) {
      return cache.addAll(["index.html"]);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.open("v1").then(async function (cache) {
      const response = await cache.match(event.request);
      var fetchPromise = fetch(event.request).then(function (networkResponse) {
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});
