import Image from "next/image"

import type { ImagenSitio } from "../types"

/**
 * Primer slide del homepage: la fotografía llena el viewport restante bajo el
 * chrome (`100svh - --catalogo-chrome-height`) en cualquier dispositivo.
 *
 * **Sin texto encima, a propósito.** Antes llevaba eyebrow, `h1`, párrafo y
 * dos CTAs anclados al lado izquierdo. Se retiraron: el arte del bucket se
 * cambia sin desplegar, así que cualquier copy escrito aquí puede contradecir
 * la pieza vigente, y el mensaje va horneado en el propio arte. Lo que queda
 * es la imagen y nada más.
 *
 * Sobrevive un `h1` **solo para lectores de pantalla** (`sr-only`): es el
 * único de la página —el resto de las secciones abre en `h2`— y sin él el
 * documento se quedaba sin encabezado de nivel 1, que es una regresión de
 * accesibilidad y de SEO en una portada pública. No se ve en pantalla.
 *
 * Ya NO es Client Component: al quitar los primitivos motion y los `Link` no
 * queda nada que necesite el cliente, así que el hero deja de aportar JS al
 * bundle.
 *
 * ENCUADRE: en móvil se ancla a la DERECHA (`object-right`) y desde `md` vuelve
 * al centro. La pieza del bucket es la de escritorio (16:9) y en un viewport
 * angosto `object-cover` recorta a lo ancho; centrarla se comía el lado
 * derecho, que es donde está el motivo.
 *
 * La FOTO la decide `site/hero/` en el bucket: la resuelve la ruta en el
 * servidor (ver `../server/queries.ts`) y llega ya como prop, así que viaja en
 * el HTML y sigue siendo el LCP. El `alt` es vacío porque la imagen es
 * decorativa y su mensaje no es texto que un lector de pantalla pueda leer.
 *
 * **Sin respaldo local.** Si no hay pieza subida, la sección queda como una
 * banda del fondo de la página: `public/photos/hero-alimentos.png` se retiró
 * del repo junto con los demás assets que ahora viven en el bucket, así que
 * apuntarle dejaría el hero roto justo en el caso que el respaldo cubría.
 */
export function HeroSection({ imagen }: { imagen?: ImagenSitio | null }) {
  return (
    <section className="relative isolate min-h-[calc(100svh-var(--catalogo-chrome-height))] w-full overflow-hidden bg-[var(--color-surface)]">
      <h1 className="sr-only">
        Catálogo JDH: todo tu mercado, en un solo lugar
      </h1>

      {imagen ? (
        <Image
          src={imagen.url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right md:object-center"
        />
      ) : null}
    </section>
  )
}
