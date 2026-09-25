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
 * de red o sin bucket configurado, así que el hero se queda sin foto (banda
 * negra con su copy) y los banners no se dibujan. El homepage es institucional
 * y no puede caerse porque falte una foto.
 */

/**
 * Las piezas del hero: todas las de `HERO_SLUGS` que estén subidas, en el
 * orden declarado. Lista vacía si no hay ninguna — el hero se dibuja entonces
 * como una banda negra con el copy encima, que sigue siendo legible.
 *
 * Van en PARALELO: el hero rota entre todas, así que ya no hay una "primera
 * que acierta casi siempre" cuya respuesta ahorre las demás peticiones, y
 * encadenarlas sumaría sus latencias al primer byte de la portada.
 */
export async function obtenerHero(): Promise<ImagenSitio[]> {
  const resueltas = await Promise.all(
    // El tipo de retorno se anota para que el `slug` no se estreche al literal
    // de `HERO_SLUGS` (`as const`) y el filtro de abajo siga hablando de
    // `ImagenSitio`, que es lo que la vista consume.
    HERO_SLUGS.map(async (slug): Promise<ImagenSitio | null> => {
      const url = await resolverImagenSitio("hero", slug)
      return url ? { slug, url } : null
    })
  )

  return resueltas.filter((imagen): imagen is ImagenSitio => imagen !== null)
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
