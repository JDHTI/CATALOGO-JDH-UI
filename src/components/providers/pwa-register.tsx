"use client"

import { useEffect } from "react"

/**
 * Registra el service worker (PWA) SOLO en producción: en dev Turbopack
 * serviría una caché stale que interfiere con el hot reload. El SW vive en
 * `public/sw.js` (network-first para navegaciones — los precios son vivos —
 * y cache-first para estáticos).
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: sin SW la app sigue funcionando, solo pierde offline.
    })
  }, [])

  return null
}
