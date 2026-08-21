"use client"

import Link from "next/link"

import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"

import type { ProductoDestacado } from "../types"
import { ProductCard } from "./product-card"

/**
 * Grid de productos destacados con precios de lista pública mockeados.
 * 2 columnas en móvil, 3 en desktop y 4 en pantallas grandes.
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

      <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {productos.map((producto) => (
          <StaggerItem key={producto.id} className="h-full">
            <ProductCard producto={producto} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
