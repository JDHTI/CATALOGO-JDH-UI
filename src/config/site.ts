/**
 * Global, non-secret site configuration. Anything environment-specific
 * (URLs, keys) belongs in env vars, not here.
 */
export const siteConfig = {
  name: "Catálogo JDH",
  shortName: "Catálogo",
  company: "Juan D. Hoyos Distribuciones",
  companyLegal: "Juan D. Hoyos Distribuciones S.A.S.",
  description:
    "Catálogo de productos de Juan D. Hoyos Distribuciones — distribución institucional, food service y retail.",
  locale: "es-CO",
  /**
   * Vista previa al compartir un enlace (OG/Twitter). JPG 1200×630, no WebP:
   * Teams, LinkedIn y algunos clientes de WhatsApp descartan WebP. Se
   * regenera con `python scripts/generate-og-image.py`.
   */
  ogImage: {
    url: "/og/catalogo-jdh.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Catálogo de productos de Juan D. Hoyos Distribuciones",
  },
  /** Shown in the footer legal bar. */
  version: "v0.1.0 · Fase 1",
  /** Sedes JDH (DESIGN.md §4.2) — usadas en el footer y en cobertura. */
  sedes: [
    "Medellín",
    "Bogotá",
    "Armenia",
    "Bucaramanga",
    "Urabá",
    "Cartagena",
    "Barranquilla",
  ],
} as const

export type SiteConfig = typeof siteConfig
