import "server-only"

import { resolverImagenSitio } from "@/lib/site-assets"

import { HERO_SLUGS, PLACEMENTS_BANNER } from "../placements"
import type { BannerSitio, ImagenSitio } from "../types"

/**
 * Resolución de las imágenes del homepage, en el SERVIDOR.
 *
 * No hay API que consultar: la UI conoce el nombre de cada placement y arma
 * la URL por convención (`src/lib/site-assets.ts`). Lo único que no puede
 * saber sin preguntar es si el archivo ya está subido, y para eso va un `HEAD`
 * por pieza, cacheado 5 minutos — el mismo `max-age` con el que el API sube
 * estas imágenes.
 *
 * Se hace en el servidor y no en un hook, al revés que el resto de las
 * secciones del home, porque el hero es el LCP: descubrirlo tras hidratar
 * significa pedir la imagen más grande del sitio en la segunda vuelta y
 * pintar un reemplazo a la vista del usuario. Al ir cacheado, `/` sigue
 * PRERENDERIZADA y se refresca sola.
 *
 * Ningún fallo se propaga: `resolverImagenSitio` devuelve `null` ante un error
 * de red o sin bucket configurado, así que el hero cae a la foto del repo y
 * los banners no se dibujan. El homepage es institucional y no puede caerse
 * porque falte una foto.
 */

/**
 * La pieza del hero: el primer slug de `HERO_SLUGS` que esté subido. `null`
 * si no hay ninguno — el hero cae entonces a la foto del repo.
 *
 * Las comprobaciones van en SERIE a propósito: son dos, la primera acierta
 * casi siempre, y en el caso normal esto hace UNA petición en vez de dos.
 */
export async function obtenerHero(): Promise<ImagenSitio | null> {
  for (const slug of HERO_SLUGS) {
    const url = await resolverImagenSitio("hero", slug)
    if (url) return { slug, url }
  }
  return null
}

/**
 * Los banners publicitarios, en el orden declarado. Se omite el hueco cuya
 * pieza de escritorio no esté subida; la de móvil se omite sola si falta y la
 * ancha se recorta al centro.
 *
 * Aquí sí van en PARALELO: son placements independientes y encadenarlos
 * sumaría sus latencias al primer byte de la portada.
 */
export async function listarBanners(): Promise<BannerSitio[]> {
  const resueltos = await Promise.all(
    PLACEMENTS_BANNER.map(async (placement) => {
      const [urlEscritorio, urlMovil] = await Promise.all([
        resolverImagenSitio("banners", placement.escritorio),
        placement.movil
          ? resolverImagenSitio("banners", placement.movil)
          : Promise.resolve(null),
      ])

      if (!urlEscritorio) return null

      return {
        id: placement.id,
        escritorio: { slug: placement.escritorio, url: urlEscritorio },
        movil:
          urlMovil && placement.movil
            ? { slug: placement.movil, url: urlMovil }
            : null,
        alt: placement.alt,
      } satisfies BannerSitio
    })
  )

  return resueltos.filter((banner): banner is BannerSitio => banner !== null)
}
