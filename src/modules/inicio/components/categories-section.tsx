"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  Apple,
  Beef,
  Cookie,
  CupSoda,
  Droplets,
  Milk,
  PackageOpen,
  Snowflake,
  SprayCan,
  Wheat,
  type LucideIcon,
} from "lucide-react"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"

import type { CategoriaDestacada, CategoriaIconoId } from "../types"

/** Mapa id → componente lucide: los datos viajan serializables desde el server. */
const CATEGORIA_ICONOS: Record<CategoriaIconoId, LucideIcon> = {
  droplets: Droplets,
  wheat: Wheat,
  milk: Milk,
  meat: Beef,
  "cup-soda": CupSoda,
  can: PackageOpen,
  cookie: Cookie,
  "spray-can": SprayCan,
  apple: Apple,
  snowflake: Snowflake,
}

/**
 * Grilla de las 10 categorías principales SIN imágenes: icono en superficie
 * subtle + nombre + descripción breve. Cada item enlaza al catálogo filtrado
 * y es interactivo (hover: borde strong + translateY — el usuario pidió
 * "no card" para la versión con imágenes; ahora que vuelven icono +
 * descripción, retomamos la card ligera del diseño original).
 *
 * Bajo `lg` las 10 categorías son un carrusel (arrastre táctil) en vez de un
 * grid de una columna — 10 filas apiladas alargaban demasiado el homepage en
 * móvil. El grid se conserva desde `lg`. El stagger de entrada solo corre en
 * la rama de grid (ver nota equivalente en `ValueProps`).
 */
function CategoryCard({ categoria }: { categoria: CategoriaDestacada }) {
  const Icon = CATEGORIA_ICONOS[categoria.icono]
  return (
    <Link
      href={`/productos?categoria=${categoria.slug}` as Route}
      className="group flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span className="flex size-11 items-center justify-center rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] text-foreground transition-transform duration-[var(--duration-fast)] group-hover:scale-110">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">{categoria.nombre}</span>
        <span className="text-xs text-muted-foreground">
          {categoria.descripcion}
        </span>
      </span>
    </Link>
  )
}

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

      <Carousel opts={{ align: "start" }} className="w-full lg:hidden">
        <CarouselContent className="items-stretch">
          {categorias.map((categoria) => (
            <CarouselItem
              key={categoria.slug}
              className="basis-[70%] sm:basis-1/3"
            >
              <CategoryCard categoria={categoria} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Stagger
        staggerDelay={0.05}
        className="hidden grid-cols-3 gap-4 lg:grid xl:grid-cols-5"
      >
        {categorias.map((categoria) => (
          <StaggerItem key={categoria.slug} className="h-full">
            <CategoryCard categoria={categoria} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
