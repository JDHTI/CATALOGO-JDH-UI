"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import {
  useDestacados,
  useRecomendacionesProducto,
} from "../hooks/use-productos"
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
 * Con las cinco cards, en móvil la pista pasa a CARRUSEL (embla), igual que
 * "Una muestra del catálogo" de la home (`FeaturedProducts`): dos cards a la
 * vista dentro del gutter, arrastre que encaja card a card y sin indicadores
 * de posición. Con menos no hace falta, y la pista libre de arriba basta.
 *
 * Es el mismo DOM en todos los anchos: desde `sm` embla se desactiva por
 * `breakpoints` y el contenido se reacomoda en la grilla de `CLASES_PISTA`.
 */
function PistaDeslizable({
  titulo,
  productos,
}: {
  titulo: string
  productos: Producto[]
}) {
  return (
    <Carousel
      aria-label={titulo}
      opts={{
        align: "start",
        breakpoints: { [DESDE_SM]: { active: false } },
      }}
    >
      <CarouselContent className="sm:ml-0 sm:grid sm:transform-none! sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {productos.map((producto) => (
          <CarouselItem
            key={producto.id}
            className="basis-1/2 sm:basis-auto sm:pl-0"
          >
            <ProductoCard producto={producto} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
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
  const { productos, isPending, isError, origen } = useRecomendacionesProducto(
    producto,
    LIMITE_VITRINA
  )
  return (
    <VitrinaProductos
      id="misma-marca-title"
      eyebrow={
        origen === "marca"
          ? "De la misma marca"
          : origen === "proveedor"
            ? "Del mismo proveedor"
            : "Descubre el catálogo"
      }
      titulo={
        origen === "catalogo"
          ? "Productos destacados"
          : `Más de ${formatNombreComercial(origen === "marca" ? producto.marca : producto.proveedor.nombre)}`
      }
      productos={productos}
      isPending={isPending}
      isError={isError}
      className={className}
    />
  )
}
