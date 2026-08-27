"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Image from "next/image"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

/**
 * Banners publicitarios del homepage, debajo de la muestra del catálogo.
 *
 * A diferencia del banner del listado (`CatalogBannerCarousel`), aquí la
 * pieza es la IMAGEN COMPLETA: sin borde, sin degradado y sin texto encima.
 * Todo el mensaje va horneado en el arte, así que el componente solo aporta
 * el marco, el recorte y el cambio entre piezas — nada que pueda competir
 * con lo que diseñó el equipo de mercadeo.
 *
 * MEDIDAS (ver `docs/brand/imagenes.md`): el bloque ocupa el ancho útil del
 * sitio —`--container-wide` (1440px) menos el gutter de `px-6`, o sea
 * 1392px— y la caja es 3:1 en escritorio y 4:3 en móvil. Exportar a 2x:
 * 2784×928 px la pieza ancha y 1440×1080 px la vertical, ambas en WebP.
 *
 * `imagenMovil` es OPCIONAL: sin ella se usa la pieza ancha recortada al
 * centro por `object-cover`, que es aceptable para un fondo pero se come los
 * bordes de cualquier texto horneado. Si el banner lleva tipografía, entrega
 * las dos piezas. Cuando existen ambas se montan dos `<img>` y el CSS elige
 * cuál mostrar, así que solo se declara `imagenMovil` cuando de verdad hay
 * un arte distinto — un `display: none` no evita la descarga.
 */

const RELACION_ESCRITORIO = "md:aspect-[3/1]"
const RELACION_MOVIL = "aspect-[4/3]"

/** `--container-wide` (1440px) menos el gutter lateral de `px-6` (2×24px). */
const ANCHO_UTIL = "(min-width: 1440px) 1392px, calc(100vw - 3rem)"

interface Banner {
  id: string
  /** Pieza ancha (3:1). Exportar 2784×928 px, WebP. */
  imagen: string
  /** Pieza vertical (4:3) para <768px. Exportar 1440×1080 px, WebP. */
  imagenMovil?: string
  /**
   * Qué anuncia el banner. Si el arte lleva texto horneado, TRANSCRÍBELO
   * aquí: es lo único que un lector de pantalla va a recibir de la pieza.
   */
  alt: string
}

/**
 * TODO(mercadeo): reemplazar por el arte definitivo en `public/banners/`
 * (`home-1.webp`, `home-1-movil.webp`, …). Mientras tanto van dos fotos del
 * portafolio ya presentes en el repo, para que la sección tenga su tamaño
 * real en pantalla y se pueda validar el encuadre.
 */
const BANNERS: Banner[] = [
  {
    id: "flota",
    imagen: "/photos/camion-carretera.webp",
    alt: "Flota JDH en carretera: entrega en siete ciudades de Colombia.",
  },
  {
    id: "patio",
    imagen: "/photos/flota-patio.webp",
    alt: "Patio de operaciones JDH cargando pedidos institucionales.",
  },
]

/** Cada cuánto rota la pieza. Largo a propósito: es publicidad, no un
 *  carrusel de navegación, y un cambio rápido se lee como parpadeo. */
const AUTOPLAY_MS = 7000

export function PromoBanner() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

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

  if (BANNERS.length === 0) return null

  return (
    <section aria-label="Publicidad" className="flex flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center" }}
        plugins={[Autoplay({ delay: AUTOPLAY_MS, stopOnMouseEnter: true })]}
      >
        <CarouselContent>
          {BANNERS.map((banner, i) => (
            <CarouselItem key={banner.id} className="basis-full">
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]",
                  RELACION_MOVIL,
                  RELACION_ESCRITORIO
                )}
              >
                {banner.imagenMovil ? (
                  <>
                    <Image
                      src={banner.imagenMovil}
                      alt={banner.alt}
                      fill
                      // La primera pieza entra en el viewport en cuanto se
                      // baja del hero; las demás nunca se ven sin interacción.
                      priority={i === 0}
                      sizes="100vw"
                      className="object-cover md:hidden"
                    />
                    <Image
                      src={banner.imagen}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes={ANCHO_UTIL}
                      className="hidden object-cover md:block"
                    />
                  </>
                ) : (
                  <Image
                    src={banner.imagen}
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
                  ? "w-5 bg-[var(--color-ink)]"
                  : "w-1.5 bg-[var(--color-border-strong)] hover:bg-[var(--color-ink)]"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
