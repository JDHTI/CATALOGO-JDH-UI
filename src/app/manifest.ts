import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * PWA manifest (installable app). No service worker: a catalog with live
 * pricing gains little from offline caching, and a SW adds risk of a stale
 * cache serving outdated prices. Icons are generated from the isotype by
 * `scripts/generate-brand-assets.mjs`. Hex values are intentional here (the
 * manifest is JSON outside the CSS token pipeline).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    lang: "es-CO",
    background_color: "#ffffff",
    theme_color: "#1D1D1B",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
