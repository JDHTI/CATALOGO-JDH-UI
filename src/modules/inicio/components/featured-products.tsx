"use client"

import Link from "next/link"

import {
  ProductCard,
  type ProductCardData,
} from "@/components/cards/product-card"
import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import type { ProductoDestacado } from "../types"

function aCardData(p: ProductoDestacado): ProductCardData {
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    marca: p.marca,
    precioCentavos: p.precioCentavos,
    unidadVenta: p.unidadVenta,
    presentacion: p.presentacion,
    descripcionCorta: p.descripcionCorta,
    descripcionLarga: p.descripcionLarga,
    detallesEmpaque: p.detallesEmpaque,
    imagen: p.imagen,
    badge: p.badge,
    disponible: true,
  }
}

/**
 * Productos destacados en CARRUSEL con imágenes cuadradas agrandadas (2 por
 * fila en móvil, 3 desde `md`, 4 desde `xl`). Arrastre nativo (embla) en
 * móvil; flechas en ≥sm a los costados. `items-stretch` en `CarouselContent`
 * es lo que hace que el `h-full` de cada `CarouselItem` funcione — sin él el
 * track flex no estira las cards y quedan de alturas distintas. Usa la card
 * de producto compartida (con modal de detalle): categoría, nombre, unidad
 * de venta, precio, favoritos y añadir.
 */
export function FeaturedProducts({
  productos,
}: {
  productos: ProductoDestacado[]
}) {
  return (
    <section aria-labelledby="destacados-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Los más pedidos
            </p>
            <h2
              id="destacados-title"
              className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
            >
              Productos destacados
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Precios de lista pública. Crea tu cuenta para ver tus precios
              negociados.
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
        <Carousel opts={{ align: "start" }}>
          <CarouselContent className="items-stretch">
            {productos.map((producto) => (
              <CarouselItem
                key={producto.id}
                className="h-full basis-1/2 md:basis-1/3 xl:basis-1/4"
              >
                <ProductCard producto={aCardData(producto)} variant="imagen" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:-left-6 sm:inline-flex" />
          <CarouselNext className="hidden sm:-right-6 sm:inline-flex" />
        </Carousel>
      </ScrollReveal>
    </section>
  )
}
