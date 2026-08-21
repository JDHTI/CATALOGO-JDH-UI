"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  Cookie,
  CupSoda,
  Droplets,
  Milk,
  SprayCan,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"

import type { CategoriaDestacada, CategoriaIconoId } from "../types"

/** Mapa id → componente lucide: los datos viajan serializables desde el server. */
const CATEGORIA_ICONOS: Record<CategoriaIconoId, LucideIcon> = {
  droplets: Droplets,
  wheat: Wheat,
  milk: Milk,
  "cup-soda": CupSoda,
  "spray-can": SprayCan,
  cookie: Cookie,
}

/**
 * Grid de categorías destacadas. Cards interactivas (hover: borde strong +
 * translateY, DESIGN.md §4.6) que enlazan al catálogo filtrado.
 */
export function CategoriesSection({
  categorias,
}: {
  categorias: CategoriaDestacada[]
}) {
  return (
    <section aria-labelledby="categorias-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Explora por categoría
          </p>
          <h2
            id="categorias-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Encuentra lo que tu operación necesita
          </h2>
        </div>
      </ScrollReveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => {
          const Icon = CATEGORIA_ICONOS[categoria.icono]
          return (
            <StaggerItem key={categoria.slug} className="h-full">
              <Link
                href={`/productos?categoria=${categoria.slug}` as Route}
                className="group flex h-full flex-col gap-4 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="flex size-12 items-center justify-center rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] text-foreground">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-base font-medium">
                    {categoria.nombre}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {categoria.descripcion}
                  </span>
                </span>
                <span className="mt-auto text-sm font-medium text-foreground underline decoration-1 underline-offset-2 group-hover:decoration-2">
                  Ver productos
                </span>
              </Link>
            </StaggerItem>
          )
        })}
      </Stagger>
    </section>
  )
}
