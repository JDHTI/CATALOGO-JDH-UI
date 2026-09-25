"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"
import { useReducedMotion } from "motion/react"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

import type { ImagenSitio } from "../types"

/**
 * Primer slide del homepage: la fotografía llena el viewport restante bajo el
 * chrome (`100svh - --catalogo-chrome-height`) en cualquier dispositivo.
 *
 * **El copy vuelve a ser TEXTO.** Hasta ahora iba horneado en el arte y el
 * componente no ponía nada encima. Eso tenía dos costos que la pieza actual
 * hizo evidentes: la errata («a nuestro clientes») solo se corregía
 * reexportando la imagen, y en móvil el recorte `object-cover` se comía
 * justamente la columna izquierda donde vivía el mensaje, así que la portada
 * se quedaba muda en el dispositivo mayoritario. Con el texto en el DOM se
 * corrige desplegando, se reflowea por breakpoint, lo lee un lector de
 * pantalla y lo indexa el buscador.
 *
 * El `h1` es el único de la página —el resto de las secciones abre en `h2`— y
 * ahora sí es visible. Las FOTOS pasan a ser decorativas (`alt=""`): su
 * mensaje ya está escrito al lado.
 *
 * Las piezas ROTAN. Vienen de `site/hero/` en el bucket, las resuelve la ruta
 * en el servidor (ver `../server/queries.ts`) y llegan ya verificadas como
 * prop, así que la primera viaja en el HTML y sigue siendo el LCP. Se publican
 * todas las de `HERO_SLUGS` que estén subidas; con una sola, el carrusel se
 * queda quieto y no se dibujan los dots.
 *
 * El arte tiene que venir **sin tipografía** — ver `../placements.ts`.
 *
 * ENCUADRE: en móvil se ancla a la DERECHA (`object-right`) y desde `md` vuelve
 * al centro. Las piezas del bucket son de escritorio (16:9) y en un viewport
 * angosto `object-cover` recorta a lo ancho; centrarlas se comía el lado
 * derecho, que es donde está el motivo.
 *
 * **Sin respaldo local.** Si no hay pieza subida queda la banda negra del
 * propio `section` con el copy encima: legible, del mismo alto y sin imagen
 * rota. Por eso el fondo es `--color-ink` y no `--color-surface` — el texto es
 * blanco, y sobre el lienzo claro del tema día desaparecería.
 */

/**
 * Alto del hero: el viewport menos el chrome sticky. La clase va en cada SLIDE
 * y no en un ancestro porque el envoltorio con `overflow-hidden` de `Carousel`
 * no acepta clases — la altura tiene que subir desde los hijos. El `min-h` de
 * la `section` la repite para que la banda conserve su alto cuando no hay
 * ninguna pieza subida y no existe ningún slide.
 *
 * Se escriben las dos LITERALES a propósito: Tailwind escanea el fuente en
 * busca de clases completas y una compuesta (`min-${ALTO_SLIDE}`) no genera
 * CSS.
 */
const ALTO_SLIDE = "h-[calc(100svh-var(--catalogo-chrome-height))]"
const ALTO_MINIMO = "min-h-[calc(100svh-var(--catalogo-chrome-height))]"

/** Cada cuánto cambia la pieza. Mismo criterio que los banners: es una
 *  fotografía institucional, no un carrusel de navegación, y un cambio rápido
 *  se lee como parpadeo. */
const AUTOPLAY_MS = 7000

/** `stopOnInteraction: false` para que pasar el cursor PAUSE y salir REANUDE,
 *  en vez de detener la rotación para siempre (el default). Mismo ajuste y
 *  mismo motivo que en `promo-banner.tsx`. */
const AUTOPLAY_OPCIONES = {
  delay: AUTOPLAY_MS,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
} as const

export function HeroSection({ imagenes }: { imagenes: ImagenSitio[] }) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  /** Una sola instancia del plugin para toda la vida del componente: crearla
   *  en el JSX la reconstruía en cada render —y este re-renderiza en cada
   *  cambio de pieza, por `current`—, dejando el temporizador a merced de
   *  cuándo vuelve a pintar React en vez del `delay`. */
  const autoplay = React.useMemo(() => Autoplay(AUTOPLAY_OPCIONES), [])

  /** `prefers-reduced-motion` (DESIGN.md, WCAG 2.2 AA): con la preferencia
   *  activa no se monta el plugin y las piezas solo cambian con los dots. */
  const reduce = useReducedMotion()
  const plugins = React.useMemo(
    () => (reduce ? [] : [autoplay]),
    [reduce, autoplay]
  )

  React.useEffect(() => {
    if (!api) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado local contra la API imperativa de embla al montar; ver .claude/ARCHITECTURE.md 2026-07-22.
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
    api.on("reInit", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  return (
    <section
      className={cn(
        "relative isolate w-full overflow-hidden bg-[var(--color-ink)]",
        ALTO_MINIMO
      )}
    >
      {imagenes.length > 0 ? (
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "center" }}
          plugins={plugins}
          aria-label="Fotografías de JDH Distribuciones"
        >
          {/* `ml-0`/`pl-0` anulan el gutter de 16px del primitivo: entre dos
              piezas full-bleed esa franja se vería como una rendija clara. */}
          <CarouselContent className="ml-0">
            {imagenes.map((imagen, i) => (
              <CarouselItem
                key={imagen.slug}
                className={cn("relative basis-full pl-0", ALTO_SLIDE)}
              >
                <Image
                  src={imagen.url}
                  alt=""
                  fill
                  // Solo la primera se ve sin esperar a la rotación, y es el
                  // LCP de la portada.
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover object-right md:object-center"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : null}

      {/* Velo de legibilidad. Cambia de EJE con el breakpoint porque el texto
          también lo hace: en móvil cae desde arriba (el copy va arriba y el
          motivo queda limpio abajo) y desde `md` barre de izquierda a derecha,
          que es donde se apoya el copy y donde el arte deja el aire. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/55 to-black/20 md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-transparent"
      />

      {/* `pointer-events-none` en el bloque de texto: encima va el arrastre del
          carrusel, y una capa a pantalla completa lo tragaría entero. */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-start pt-[var(--space-12)] md:justify-center md:pt-0">
        <div className="mx-auto w-full max-w-[var(--container-wide)] px-6">
          <h1 className="max-w-[16ch] text-[2rem] leading-[1.05] font-bold tracking-tight text-balance text-[var(--color-on-ink)] sm:text-5xl lg:text-6xl">
            Acompañar en todo momento a nuestros clientes,
          </h1>
          <p className="mt-[var(--space-6)] max-w-[38ch] text-base leading-relaxed text-[var(--color-on-ink)] sm:text-lg lg:text-xl">
            Y garantizar un servicio con los mejores estándares,{" "}
            <strong className="font-bold">
              ha sido y será nuestra mayor promesa.
            </strong>
          </p>
        </div>
      </div>

      {/* Los dots son el único control, como en los banners: con dos piezas
          unas flechas pesan más en pantalla que el cambio que disparan. */}
      {imagenes.length > 1 ? (
        <div
          className="absolute inset-x-0 bottom-[var(--space-8)] z-30 flex items-center justify-center gap-2"
          aria-label="Seleccionar fotografía"
        >
          {imagenes.map((imagen, i) => (
            <button
              key={imagen.slug}
              type="button"
              aria-label={`Fotografía ${i + 1} de ${imagenes.length}`}
              aria-pressed={i === current}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-[var(--duration-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-on-ink)] focus-visible:outline-none",
                i === current
                  ? "w-5 bg-[var(--color-on-ink)]"
                  : "w-1.5 bg-[var(--overlay-on-dark-64)] hover:bg-[var(--color-on-ink)]"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
