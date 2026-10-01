/**
 * Imágenes editables del homepage: las que mercadeo cambia subiendo un
 * archivo al bucket, sin desplegar. Salen de dos carpetas —`site/hero/` y
 * `site/banners/`— y la UI arma sus URLs por convención, sin API de por medio
 * (ver `src/lib/site-assets.ts`).
 *
 * Aquí solo viven los tipos de DOMINIO. Los placements concretos —qué slug
 * ocupa cada hueco— se declaran en `placements.ts`.
 */

/** Una pieza ya resuelta: existe en el bucket y tiene URL servible. */
export interface ImagenSitio {
  /** Slug del placement (`home-1-desktop`). Identidad estable de la pieza. */
  slug: string
  /** URL pública absoluta, servible por `next/image`. */
  url: string
}

/**
 * Una pieza del hero ya resuelta: la declaración de `placements.ts` más la URL
 * del bucket. Lleva su propio encuadre de móvil porque cada fotografía compuso
 * el motivo en un sitio distinto y en un viewport angosto solo se ve un tercio
 * del master — ver `PiezaHeroDeclarada`.
 */
export interface PiezaHero extends ImagenSitio {
  /** Clase de `object-position` para móvil (`<md`). */
  encuadreMovil: string
}

/**
 * Un logo del tablero de marcas, del manifiesto `brands/manifest.json` del
 * bucket. El manifiesto solo trae `slug` y `logo`; `nombre` se deriva del slug
 * (alt del logo) y no es el nombre del catálogo — por eso el tablero no enlaza.
 */
export interface LogoMarca {
  slug: string
  nombre: string
  /** URL inmutable (lleva hash): cacheable sin límite. */
  logo: string
}

/**
 * Una pieza publicitaria del homepage. `escritorio` es obligatoria (es la que
 * se recorta si falta la otra) y `movil` opcional — misma regla que ya
 * documenta `docs/brand/imagenes.md`.
 */
export interface BannerSitio {
  /** El placement, sin el sufijo de formato (`home-1`). */
  id: string
  escritorio: ImagenSitio
  movil: ImagenSitio | null
  /**
   * Qué anuncia la pieza. **Vive en el código** (`placements.ts`), no en el
   * bucket: sin API no hay metadato que acompañe al objeto. Es la costura
   * incómoda de este diseño — cambiar el arte no requiere desplegar, pero
   * cambiar su texto alternativo sí.
   */
  alt: string
}
