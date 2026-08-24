/* Service worker del catálogo JDH — PWA instalable.
   Estrategia:
   - Navegaciones (HTML): NETWORK-FIRST — los precios son datos vivos y nunca
     deben servirse de una caché stale; el fallback offline sirve la última
     copia en caché.
   - Estáticos (css/js/fonts/imágenes): CACHE-FIRST con revalidación en
     background — primera visita descarga y cachea; las siguientes son
     instantáneas.
   Bump de VERSION invalida todas las cachés (nuevo deploy). */
const VERSION = "jdh-catalogo-v1"
const STATIC_CACHE = `${VERSION}-static`
const PAGES_CACHE = `${VERSION}-pages`

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navegaciones: network-first.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches
            .open(PAGES_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {})
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    )
    return
  }

  // Estáticos: cache-first + revalidación en background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => {})
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
