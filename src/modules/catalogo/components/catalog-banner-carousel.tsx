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

const BANNERS = [
  {
    id: "aceites",
    titulo: "Aceites y grasas",
    texto: "Cocina institucional con rendimiento constante.",
    imagen: "/photos/categorias/aceites-y-grasas.jpg",
  },
  {
    id: "granos",
    titulo: "Granos y cereales",
    texto: "Granel con trazabilidad de origen.",
    imagen: "/photos/categorias/granos-y-cereales.jpg",
  },
  {
    id: "lacteos",
    titulo: "Lácteos",
    texto: "Cadena de frío de la planta a tu bodega.",
    imagen: "/photos/categorias/lacteos.jpg",
  },
  {
    id: "bebidas",
    titulo: "Bebidas",
    texto: "Gaseosas, aguas y jugos para food service.",
    imagen: "/photos/categorias/bebidas.jpg",
  },
  {
    id: "carnicos",
    titulo: "Cárnicos y fríos",
    texto: "Embutidos y carnes frías de mostrador.",
    imagen: "/photos/categorias/carnicos-y-frios.jpg",
  },
  {
    id: "enlatados",
    titulo: "Enlatados y conservas",
    texto: "Despensa institucional con estándar de exportación.",
    imagen: "/photos/categorias/enlatados-y-conservas.jpg",
  },
]

/**
 * Banner de publicidad del listado: carrusel de IMÁGENES de producto (fotos
 * reales del portafolio) con autoplay y dots. Va DENTRO de la columna de
 * resultados (mismo ancho que la lista de productos — "fixeado al tamaño de
 * las listas"). Texto sobre la imagen con degradado oscuro sutil para
 * legibilidad.
 *
 * Pieza PURAMENTE VISUAL: no lleva CTA. Los banners enlazaban a
 * `/productos?categoria=…`, un filtro por categorías que nunca existió en
 * los datos reales — la clasificación del catálogo es por proveedor y marca
 * (ver `catalog-filters.tsx`). Antes que inventar un destino, el banner se
 * queda como publicidad del portafolio.
 */
export function CatalogBannerCarousel() {
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

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center" }}
        plugins={[Autoplay({ delay: 5000, stopOnMouseEnter: true })]}
      >
        <CarouselContent>
          {BANNERS.map((banner) => (
            <CarouselItem key={banner.id} className="basis-full">
              <div className="relative h-48 w-full overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-ink)] sm:h-56">
                <Image
                  src={banner.imagen}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
                {/* Degradado sutil para legibilidad del texto on-ink. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)/55%] to-transparent"
                />
                <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 px-8">
                  <p className="font-mono text-xs tracking-[0.08em] text-[var(--color-on-ink-muted)] uppercase">
                    Destacado
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-balance text-[var(--color-on-ink)] sm:text-2xl">
                    {banner.titulo}
                  </h3>
                  <p className="max-w-[34ch] text-sm text-[var(--color-on-ink-muted)]">
                    {banner.texto}
                  </p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

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
    </div>
  )
}
