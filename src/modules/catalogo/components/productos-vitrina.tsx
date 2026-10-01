"use client"

import * as React from "react"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useDestacados, useMismaMarca } from "../hooks/use-productos"
import type { Producto } from "../types"
import { ProductoCard, ProductoCardSkeleton } from "./producto-card"

/** Cuántos productos lleva cada vitrina. */
const LIMITE_VITRINA = 5

/**
 * Contenedor: PISTA deslizable en móvil y grilla desde `sm` (3 columnas, 5 en
 * `lg`: una sola fila con las cinco). En pista, la card siguiente asoma
 * cortada por el borde — `-mx-4 px-4` sangra contra el gutter de
 * `CatalogoPage`. Scroll libre, sin snap y con `overflow-y-hidden`, por lo
 * mismo que las pistas del homepage (ver `inicio-view.tsx`).
 */
const CLASES_PISTA =
  "no-scrollbar -mx-4 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5"
const CLASES_ITEM = "w-[46%] shrink-0 sm:w-auto"

/** Desde aquí la vitrina es grilla: embla se apaga y deja de arrastrar. */
const DESDE_SM = "(min-width: 640px)"

/**
 * Con las cinco cards, en móvil la pista pasa a CARRUSEL (embla): arrastre con
 * inercia que encaja card a card y puntos de posición debajo. Con menos no
 * hace falta, y la pista libre de arriba basta.
 *
 * Es el mismo DOM en todos los anchos: desde `sm` embla se desactiva por
 * `breakpoints` y el contenido se reacomoda en la grilla de `CLASES_PISTA`.
 * El sangrado contra el gutter sale de `-mx-4` en la raíz, `ml-0` en el track
 * (anula el `-ml-4` de shadcn, así el `pl-4` del primer slide hace de gutter)
 * y `mr-4` en el último slide, que embla mide como hueco final. Sin ese
 * margen, la última card quedaba pegada al borde de la pantalla.
 */
function PistaDeslizable({
  titulo,
  productos,
}: {
  titulo: string
  productos: Producto[]
}) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [actual, setActual] = React.useState(0)
  const [total, setTotal] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    const sincronizar = () => {
      setTotal(api.scrollSnapList().length)
      setActual(api.selectedScrollSnap())
    }
    sincronizar()
    api.on("select", sincronizar)
    api.on("reInit", sincronizar)
    return () => {
      api.off("select", sincronizar)
      api.off("reInit", sincronizar)
    }
  }, [api])

  return (
    <div className="flex flex-col gap-4">
      <Carousel
        setApi={setApi}
        aria-label={titulo}
        opts={{
          align: "start",
          // De a dos: es lo que cabe a la vista. Card a card daba cinco
          // puntos y el último movía ~17px — solo el hueco final, porque la
          // card que asoma ya casi está entera. Con grupos quedan tres
          // posiciones que sí cambian lo que se ve.
          slidesToScroll: 2,
          breakpoints: { [DESDE_SM]: { active: false } },
        }}
        className="-mx-4 sm:mx-0"
      >
        <CarouselContent className="ml-0 sm:grid sm:transform-none! sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {productos.map((producto) => (
            <CarouselItem
              key={producto.id}
              className="basis-[calc(46%+1rem)] last:mr-4 sm:basis-auto sm:pl-0 sm:last:mr-0"
            >
              <ProductoCard producto={producto} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {total > 1 ? (
        <div
          className="flex items-center justify-center gap-2 sm:hidden"
          aria-label={`Posición en ${titulo}`}
        >
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir al grupo ${i + 1} de ${total}`}
              aria-pressed={i === actual}
              onClick={() => api?.scrollTo(i)}
              // El punto visible mide 6px; el `p-2` agranda el área táctil
              // sin cambiar lo que se ve.
              className="group flex items-center p-2 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-[var(--duration-base)] group-focus-visible:ring-2 group-focus-visible:ring-ring",
                  i === actual
                    ? "w-5 bg-foreground"
                    : "w-1.5 bg-[var(--color-border-strong)]"
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Fila de hasta cinco productos con encabezado. Pieza de presentación: los
 * datos los ponen `DestacadosCatalogo` y `MismaMarcaSection`.
 *
 * Sin productos (error o vacío) la sección NO se pinta: es un complemento al
 * pie del listado o de la ficha, no el contenido que el usuario vino a ver, y
 * un estado vacío ahí solo sería ruido.
 */
function VitrinaProductos({
  id,
  eyebrow,
  titulo,
  productos,
  isPending,
  isError,
  className,
}: {
  id: string
  eyebrow: string
  titulo: string
  productos: Producto[]
  isPending: boolean
  isError: boolean
  className?: string
}) {
  if (isError || (!isPending && productos.length === 0)) return null

  return (
    <section
      aria-labelledby={id}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="text-xl font-bold tracking-tight text-balance sm:text-2xl"
        >
          {titulo}
        </h2>
      </div>

      {!isPending && productos.length === LIMITE_VITRINA ? (
        <PistaDeslizable titulo={titulo} productos={productos} />
      ) : (
        <div className={CLASES_PISTA}>
          {isPending
            ? Array.from({ length: LIMITE_VITRINA }, (_, i) => (
                <div key={i} className={CLASES_ITEM} aria-hidden="true">
                  <ProductoCardSkeleton />
                </div>
              ))
            : productos.map((producto) => (
                <div key={producto.id} className={CLASES_ITEM}>
                  <ProductoCard producto={producto} />
                </div>
              ))}
        </div>
      )}
    </section>
  )
}

/**
 * Destacados al pie de `/productos`: cinco productos con imagen de
 * `GET /products/destacados` — el mismo criterio que la vitrina de la home
 * (reparto por marca, rotación diaria). Provisional: el día que exista una
 * curaduría comercial, el endpoint cambia y esta sección no.
 */
export function DestacadosCatalogo({ className }: { className?: string }) {
  const { data, isPending, isError } = useDestacados(LIMITE_VITRINA)
  return (
    <VitrinaProductos
      id="destacados-catalogo-title"
      eyebrow="Destacados"
      titulo="Productos destacados"
      productos={data?.data ?? []}
      isPending={isPending}
      isError={isError}
      className={className}
    />
  )
}

/** Al pie de la ficha: cinco productos con imagen de la misma marca. */
export function MismaMarcaSection({
  producto,
  className,
}: {
  producto: Producto
  className?: string
}) {
  const { productos, isPending, isError } = useMismaMarca(
    producto,
    LIMITE_VITRINA
  )
  return (
    <VitrinaProductos
      id="misma-marca-title"
      eyebrow="De la misma marca"
      titulo={`Más de ${formatNombreComercial(producto.marca)}`}
      productos={productos}
      isPending={isPending}
      isError={isError}
      className={className}
    />
  )
}
