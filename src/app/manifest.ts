import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

/**
 * PWA manifest (installable app). Service worker en `/sw.js` (registrado por
 * `PwaRegister` solo en producción): navegaciones network-first — un catálogo
 * con precios vivos nunca sirve HTML stale — y estáticos cache-first. Icons
 * son generados del isotipo por `scripts/generate-brand-assets.mjs`. Hex
 * values son intencionales aquí (el manifest es JSON fuera del pipeline de
 * tokens CSS).
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
