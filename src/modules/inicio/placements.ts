/**
 * Los HUECOS de imagen del homepage y el slug que ocupa cada uno en el
 * bucket. Es el único archivo que hay que tocar para añadir o quitar un
 * banner; el arte de un hueco existente se cambia SUBIENDO el archivo, sin
 * pasar por aquí:
 *
 *     pnpm site-images:upload -- --categoria=banners --slug=home-1-desktop --archivo=./pieza.png
 *
 * (el comando vive en el repo del API, `jdh-catalogo-api`.)
 *
 * Los slugs siguen la convención del backend: nombran el PLACEMENT, no la
 * campaña — `home-desktop-1`, no `blackfriday-2026`. Los de abajo son los que
 * de verdad están en el bucket, verificados uno por uno con `HEAD`; el formato
 * va ANTES del índice (`home-desktop-1`, no `home-1-desktop`).
 */

/**
 * Candidatos del hero, EN ORDEN DE PRIORIDAD: se publica el primero que esté
 * subido. Es lo más cerca que se puede estar de "la primera pieza de la
 * carpeta" sin un endpoint que liste el bucket, y da el mismo efecto útil —
 * dejar el arte de la próxima campaña subido con otro nombre y activarlo
 * renombrándolo.
 *
 * `home-desktop` va primero porque es lo que hay hoy en el bucket
 * (verificado: 200, 399 KB, `image/webp`). `home` queda detrás como nombre
 * alternativo, que es el que sugiere la documentación del API.
 */
export const HERO_SLUGS = ["home-desktop", "home"] as const

/** Un hueco publicitario: dos archivos, uno por formato. */
export interface PlacementBanner {
  /** El placement sin sufijo de formato. Identifica el hueco. */
  id: string
  /** Slug de la pieza ancha (≥768px). Obligatoria. */
  escritorio: string
  /**
   * Slug de la pieza de móvil (<768px). Opcional: sin ella la ancha se
   * recorta al centro, aceptable para un fondo pero no para texto horneado.
   */
  movil?: string
  /**
   * Texto alternativo. Si el arte lleva texto horneado, TRANSCRÍBELO aquí: es
   * lo único que un lector de pantalla recibe de la pieza. Cambiarlo SÍ
   * requiere despliegue — ver `types.ts`.
   */
  alt: string
}

/**
 * Los dos huecos publicitarios del homepage, en el orden en que rotan.
 *
 * Un hueco cuyo archivo de escritorio no esté subido se OMITE (no se dibuja
 * un recuadro vacío), así que declarar aquí un banner futuro no rompe nada:
 * aparece solo cuando existe su pieza.
 */
export const PLACEMENTS_BANNER: PlacementBanner[] = [
  {
    id: "home-1",
    escritorio: "home-desktop-1",
    movil: "home-mobile-1",
    alt: "Banner publicitario del catálogo JDH.",
  },
  {
    id: "home-2",
    escritorio: "home-desktop-2",
    movil: "home-mobile-2",
    alt: "Banner publicitario del catálogo JDH.",
  },
]
