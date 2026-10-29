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

import type { BannerSitio } from "../types"

/**
 * Banners publicitarios del homepage, debajo de la muestra del catálogo.
 *
 * A diferencia del banner del listado (`CatalogBannerCarousel`), aquí la
 * pieza es la IMAGEN COMPLETA: sin borde, sin degradado y sin texto encima.
 * Todo el mensaje va horneado en el arte, así que el componente solo aporta
 * el marco, el recorte y el cambio entre piezas — nada que pueda competir
 * con lo que diseñó el equipo de mercadeo.
 *
 * Las piezas ROTAN SOLAS cada `AUTOPLAY_MS`, en bucle. Ver `AUTOPLAY_OPCIONES`
 * para por qué la rotación se detenía antes y no volvía.
 *
 * LAS PIEZAS VIENEN DEL BUCKET (`site/banners/`), no del repo: mercadeo
 * cambia la publicidad sobreescribiendo archivos, sin desplegar. Los huecos y
 * sus dos formatos se declaran en `../placements.ts` y la ruta los resuelve
 * en el servidor, así que llegan aquí ya emparejados y verificados. Sin
 * piezas la sección no se dibuja: una franja publicitaria vacía o en
 * fantasma no comunica nada.
 *
 * MEDIDAS (ver `docs/brand/imagenes.md`): el bloque ocupa el ancho útil del
 * sitio —`--container-wide` (1440px) menos el gutter de `px-6`, o sea
 * 1392px— y solo baja de ALTO respecto a la primera versión: dos tercios,
 * de 464px a 310px en escritorio (y de 4:3 a 2:1 en móvil). El ancho no se
 * toca, que era el requisito: de margen a margen, sin espacios extra.
 * Exportar a 2x: 2784×620 px la pieza ancha y 1440×720 px la de móvil,
 * ambas en WebP.
 *
 * La pieza de MÓVIL es opcional: sin ella se usa la ancha recortada al centro
 * por `object-cover`, que es aceptable para un fondo pero se come los bordes
 * de cualquier texto horneado. Si el banner lleva tipografía, sube las dos.
 * Cuando existen ambas se montan dos `<img>` y el CSS elige cuál mostrar, así
 * que la de móvil solo se declara cuando de verdad hay un arte distinto — un
 * `display: none` no evita la descarga.
 */

/** 1392×310 CSS. Se escribe como fracción literal y no como `4.49/1` para
 *  que se lea de dónde sale: es el ancho útil del sitio por el alto real. */
const RELACION_ESCRITORIO = "md:aspect-[1392/310]"
const RELACION_MOVIL = "aspect-[2/1]"

/** `--container-wide` (1440px) menos el gutter lateral de `px-6` (2×24px). */
const ANCHO_UTIL = "(min-width: 1440px) 1392px, calc(100vw - 3rem)"

/** Cada cuánto rota la pieza. Largo a propósito: es publicidad, no un
 *  carrusel de navegación, y un cambio rápido se lee como parpadeo. */
const AUTOPLAY_MS = 7000

/**
 * Por qué estas opciones y no los valores por defecto — antes la rotación
 * automática se detenía y no volvía:
 *
 * - **`stopOnInteraction: false`** es la corrección importante. Su default es
 *   `true`, que detiene el autoplay PARA SIEMPRE en cuanto hay una
 *   interacción. Combinado con `stopOnMouseEnter`, bastaba pasar el cursor por
 *   encima una vez —trivial, el banner ocupa el ancho de la página— para que
 *   los banners no volvieran a rotar en toda la visita. Con `false`, entrar con
 *   el cursor PAUSA y salir REANUDA, que es el comportamiento que se buscaba.
 * - **`stopOnMouseEnter: true`** se conserva: si alguien se detiene a leer la
 *   pieza, cambiarla debajo del cursor es hostil.
 */
const AUTOPLAY_OPCIONES = {
  delay: AUTOPLAY_MS,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
} as const

export function PromoBanner({ banners }: { banners: BannerSitio[] }) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  /**
   * Una sola instancia del plugin para toda la vida del componente. Crearla
   * en el JSX la reconstruía en cada render —y este componente re-renderiza
   * en cada cambio de pieza, por `current`—, lo que deja el temporizador a
   * merced de cuándo vuelve a pintar React en vez de del `delay`.
   */
  const autoplay = React.useMemo(() => Autoplay(AUTOPLAY_OPCIONES), [])

  /**
   * Respetar `prefers-reduced-motion` (DESIGN.md, WCAG 2.2 AA): con la
   * preferencia activa no se monta el plugin y las piezas solo cambian con los
   * dots. Es la misma regla que siguen los primitivos de `components/motion`.
   */
  const reduce = useReducedMotion()
  const plugins = React.useMemo(
    () => (reduce ? [] : [autoplay]),
    [reduce, autoplay]
  )

  React.useEffect(() => {
    if (!api) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado local contra la API imperativa de embla al montar; ver .claude/ARCHITECTURE.md 2026-07-22.
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
    api.on("reInit", () => {
      setCount(api.scrollSnapList().length)
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  if (banners.length === 0) return null

  return (
    <section aria-label="Publicidad" className="flex flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center" }}
        plugins={plugins}
      >
        <CarouselContent>
          {banners.map((banner, i) => (
            <CarouselItem key={banner.id} className="basis-full">
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]",
                  RELACION_MOVIL,
                  RELACION_ESCRITORIO
                )}
              >
                {banner.movil ? (
                  <>
                    <Image
                      src={banner.movil.url}
                      alt={banner.alt}
                      fill
                      // La primera pieza entra en el viewport en cuanto se
                      // baja del hero; las demás nunca se ven sin interacción.
                      priority={i === 0}
                      sizes="100vw"
                      className="object-cover md:hidden"
                    />
                    <Image
                      src={banner.escritorio.url}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes={ANCHO_UTIL}
                      className="hidden object-cover md:block"
                    />
                  </>
                ) : (
                  <Image
                    src={banner.escritorio.url}
                    alt={banner.alt}
                    fill
                    priority={i === 0}
                    sizes={ANCHO_UTIL}
                    className="object-cover"
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Los dots son el único control: con dos piezas, unas flechas pesan
          más en pantalla que el propio cambio que disparan. */}
      {count > 1 ? (
        <div
          className="flex items-center justify-center gap-2"
          aria-label="Seleccionar banner"
        >
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1} de ${count}`}
              aria-pressed={i === current}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-[var(--duration-base)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                i === current
                  ? "w-5 bg-foreground"
                  : "w-1.5 bg-[var(--color-border-strong)] hover:bg-foreground"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
