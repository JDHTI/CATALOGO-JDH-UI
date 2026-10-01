import "server-only"

import { BASE_URL, resolverImagenSitio } from "@/lib/site-assets"

import { PIEZAS_HERO, PLACEMENTS_BANNER } from "../placements"
import {
  manifiestoMarcasSchema,
  nombreDesdeSlug,
  parsearMarcas,
} from "../schemas/manifiesto-marcas"
import type { BannerSitio, LogoMarca, PiezaHero } from "../types"

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
 * Las piezas del hero: todas las de `PIEZAS_HERO` que estén subidas, en el
 * orden declarado y con su encuadre de móvil. Lista vacía si no hay ninguna —
 * el hero se dibuja entonces como una banda negra con el copy encima, que
 * sigue siendo legible.
 *
 * Van en PARALELO: el hero rota entre todas, así que ya no hay una "primera
 * que acierta casi siempre" cuya respuesta ahorre las demás peticiones, y
 * encadenarlas sumaría sus latencias al primer byte de la portada.
 */
export async function obtenerHero(): Promise<PiezaHero[]> {
  const resueltas = await Promise.all(
    PIEZAS_HERO.map(async (pieza): Promise<PiezaHero | null> => {
      const url = await resolverImagenSitio("hero", pieza.slug)
      return url ? { ...pieza, url } : null
    })
  )

  return resueltas.filter((pieza): pieza is PiezaHero => pieza !== null)
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

/** El `max-age` con el que el API publica el manifiesto de marcas. */
const REVALIDATE_MANIFIESTO_S = 60

/**
 * Logos del tablero de marcas, del manifiesto que el API publica en el bucket
 * (`brands/manifest.json`). La lista crece sin desplegar, así que la UI no
 * fija ni logos ni cantidad.
 *
 * Se lee en el SERVIDOR por fuerza: el bucket no devuelve
 * `Access-Control-Allow-Origin` y un `fetch` desde el navegador falla. Los
 * `<img>` no necesitan CORS. Con `revalidate` alineado al `max-age` del
 * manifiesto, `/` sigue estática.
 *
 * `null` = no se pudo leer (sin bucket configurado, red, JSON inválido); la
 * sección distingue eso de una lista vacía para elegir su nota.
 */
export async function listarLogosMarcas(): Promise<LogoMarca[] | null> {
  if (!BASE_URL) return null

  try {
    const respuesta = await fetch(`${BASE_URL}/brands/manifest.json`, {
      next: { revalidate: REVALIDATE_MANIFIESTO_S },
    })
    if (!respuesta.ok) return null

    const manifiesto = manifiestoMarcasSchema.safeParse(await respuesta.json())
    if (!manifiesto.success) return null

    return parsearMarcas(manifiesto.data.marcas).map((marca) => ({
      ...marca,
      nombre: nombreDesdeSlug(marca.slug),
    }))
  } catch {
    return null
  }
}
