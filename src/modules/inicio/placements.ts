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
 * Las piezas del hero, EN ORDEN DE ROTACIÓN: se publican TODAS las que estén
 * subidas y el hero las alterna solo. Antes era una lista de candidatos y se
 * publicaba solo la primera que existiera; ahora el hueco es un carrusel, así
 * que un slug que falte se omite en vez de tapar a los siguientes.
 *
 * El texto del hero **ya no está horneado en el arte**: lo pone el componente
 * (`components/hero-section.tsx`) y es el mismo sobre las dos piezas. Por eso
 * el arte que va aquí tiene que venir SIN tipografía — si no, se leerían dos
 * mensajes superpuestos.
 *
 * `home-desktop` (la pieza vieja, con el copy quemado) queda FUERA de la lista
 * a propósito: sigue en el bucket pero ya no se publica.
 */
export const PIEZAS_HERO: PiezaHeroDeclarada[] = [
  {
    slug: "home-desktop-1",
    // El camión vive en el centro-derecha del master (≈59% del ancho). Con
    // `object-right` la ventana de móvil caía en la carretera y el vehículo
    // quedaba fuera de cuadro; 62% lo centra en el recorte.
    encuadreMovil: "object-[62%_center]",
  },
  {
    slug: "home-desktop-2",
    // El equipo ya está pegado al lado derecho del master: el anclaje a la
    // derecha lo deja completo.
    encuadreMovil: "object-right",
  },
]

/** Una pieza del hero tal como se declara aquí, antes de resolverla contra el
 *  bucket. La resuelta (`PiezaHero` en `types.ts`) le añade la URL. */
export interface PiezaHeroDeclarada {
  /** Slug en `site/hero/`. Nombra el placement, no la campaña. */
  slug: string
  /**
   * `object-position` de esta pieza **en móvil** (`<md`), como clase de
   * Tailwind. En escritorio todas van centradas: la caja es apaisada y el
   * recorte solo quita arriba y abajo. En un viewport angosto, en cambio,
   * `object-cover` deja ver apenas un tercio del master a lo ancho, y dónde
   * cae ese tercio depende de dónde compuso el motivo cada fotografía — no
   * hay un valor que sirva para las dos.
   */
  encuadreMovil: string
}

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
