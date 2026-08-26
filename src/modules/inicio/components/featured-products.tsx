"use client"

import Link from "next/link"

import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useProductos } from "@/modules/catalogo/hooks/use-productos"
import {
  ProductoCard,
  ProductoCardFantasma,
  ProductoCardSkeleton,
} from "@/modules/catalogo/components/producto-card"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/** Cuántas referencias trae el carrusel de la primera página del catálogo. */
const MUESTRA = 8

/**
 * Muestra del portafolio en CARRUSEL, con productos REALES del API: la
 * primera página de `GET /products`. Arrastre nativo (embla) en móvil;
 * flechas en ≥sm a los costados. Usa la misma card que el listado
 * (`ProductoCard`) — sin precio y sin carrito, porque el catálogo es
 * referencia visual.
 *
 * Antes vivía de un dataset mockeado con precios y botón "Añadir": ambos
 * desaparecieron con los datos inventados.
 *
 * Sin datos la sección NO desaparece: conserva su encabezado y muestra un
 * `SectionEmpty`. Ocultarla dejaba la homepage sin cuerpo cuando el catálogo
 * está vacío, que es justo el estado en el que hoy vive el backend.
 */
export function FeaturedProducts() {
  const { data, isPending, isError } = useProductos({ limit: MUESTRA })
  const productos = data?.data ?? []
  const vacio = !isPending && productos.length === 0

  return (
    <section aria-labelledby="destacados-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Del portafolio
            </p>
            <h2
              id="destacados-title"
              className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
            >
              Una muestra del catálogo
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Consulta el portafolio completo por proveedor, marca o código de
              producto.
            </p>
          </div>
          <JdhButton
            asChild
            variant="ghost"
            className="shrink-0 self-start sm:self-auto"
          >
            <Link href="/productos">Ver todo el catálogo</Link>
          </JdhButton>
        </div>
      </ScrollReveal>

      <ScrollReveal y={24}>
        {isError || vacio ? (
          // Fila fantasma con la silueta real de las cards (incluido el
          // marco de la imagen), para que la sección tenga cuerpo antes de
          // que existan productos.
          <div className="flex flex-col gap-4">
            <div
              className="grid grid-cols-2 gap-4 md:grid-cols-3"
              aria-hidden="true"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <ProductoCardFantasma key={i} />
              ))}
            </div>
            <SectionNota
              mensaje={
                isError
                  ? SECTION_EMPTY_COPY.error
                  : SECTION_EMPTY_COPY.sinDatos("productos")
              }
            />
          </div>
        ) : (
          <Carousel opts={{ align: "start" }}>
            <CarouselContent>
              {isPending
                ? Array.from({ length: 4 }, (_, i) => (
                    <CarouselItem key={i} className="basis-1/2 md:basis-1/3">
                      <ProductoCardSkeleton />
                    </CarouselItem>
                  ))
                : productos.map((producto) => (
                    <CarouselItem
                      key={producto.id}
                      className="basis-1/2 md:basis-1/3"
                    >
                      <ProductoCard producto={producto} />
                    </CarouselItem>
                  ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:-left-6 sm:inline-flex" />
            <CarouselNext className="hidden sm:-right-6 sm:inline-flex" />
          </Carousel>
        )}
      </ScrollReveal>
    </section>
  )
}
