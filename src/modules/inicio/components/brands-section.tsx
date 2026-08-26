"use client"

import Image from "next/image"
import Link from "next/link"
import type { Route } from "next"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNumero } from "@/lib/format"
import { useMarcas } from "@/modules/catalogo/hooks/use-productos"

import { SECTION_EMPTY_COPY, SectionEmpty } from "./section-empty"

/** Marcas que caben en la grilla (5 columnas × 6 filas en desktop). */
const MAX_VISIBLES = 30

/**
 * Logos disponibles en `public/photos/marcas/`. Es un catálogo de ASSETS, no
 * de datos: si el nombre real que llega del API normaliza a uno de estos
 * slugs, la celda muestra el logo; si no, muestra el nombre en texto. Así la
 * sección nunca depende de que el asset exista.
 */
const LOGOS_DISPONIBLES = new Set([
  "aguila-roja",
  "alpina",
  "arcor",
  "bimbo",
  "campbells",
  "coca-cola",
  "colgate",
  "corona",
  "crem-helado",
  "danone",
  "delmonte",
  "doritos",
  "heinz",
  "lactalis",
  "lays",
  "lipton",
  "maggi",
  "nestle",
  "noel",
  "nutella",
  "oetker",
  "oreo",
  "pepsi",
  "pietran",
  "pringles",
  "quaker",
  "rica",
  "tosh",
  "yoplait",
  "zenu",
])

/**
 * Normaliza el nombre de una marca a slug de archivo: minúsculas, sin
 * acentos, sin sufijos societarios y con guiones. "Alpina S.A." → "alpina".
 */
function logoDeMarca(nombre: string): string | null {
  const slug = nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(s\.?a\.?s?|ltda|inc|sa)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return LOGOS_DISPONIBLES.has(slug) ? `/photos/marcas/${slug}.png` : null
}

/**
 * Banner de MARCAS del catálogo: grilla con hairline-grid (gap-px sobre
 * borde) donde cada celda enlaza al listado filtrado por esa marca. Las
 * marcas son el SEGUNDO eje de clasificación real y son distintas de los
 * proveedores: un proveedor distribuye varias marcas.
 *
 * Los datos vienen de `GET /brands`. Antes eran una lista estática de 30
 * marcas del sector que no correspondía a nada consultable. Sin datos
 * mantiene su encabezado con un `SectionEmpty`; solo desaparece del todo si
 * el backend no publica el endpoint (404), porque entonces el eje marca aún
 * no existe como concepto y anunciarlo confundiría.
 */
export function BrandsSection() {
  const { data, isPending, isError, noImplementado } = useMarcas()

  const marcas = (data ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_VISIBLES)

  if (noImplementado) return null

  const vacio = !isPending && marcas.length === 0

  return (
    <section aria-labelledby="marcas-title" className="flex flex-col gap-8">
      <ScrollReveal>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Las marcas que ya conoces
          </p>
          <h2
            id="marcas-title"
            className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Marcas del portafolio institucional
          </h2>
        </div>
      </ScrollReveal>

      {isPending ? (
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="h-[6.5rem] animate-pulse bg-[var(--color-surface-subtle)]"
            />
          ))}
        </div>
      ) : isError ? (
        <SectionEmpty mensaje={SECTION_EMPTY_COPY.error} />
      ) : vacio ? (
        <SectionEmpty
          mensaje={SECTION_EMPTY_COPY.sinDatos("marcas publicadas")}
        />
      ) : (
        <Stagger
          staggerDelay={0.03}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {marcas.map((marca) => {
            const logo = logoDeMarca(marca.nombre)
            return (
              <StaggerItem key={marca.id} className="h-full">
                <Link
                  href={`/productos?marca=${marca.id}` as Route}
                  className="flex h-full min-h-[6.5rem] flex-col items-center justify-center gap-2 bg-[var(--color-surface)] px-4 py-6 text-center transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {logo ? (
                    <Image
                      src={logo}
                      alt={marca.nombre}
                      width={96}
                      height={48}
                      className="h-10 w-auto max-w-full object-contain"
                    />
                  ) : (
                    <span className="line-clamp-2 text-sm font-medium">
                      {marca.nombre}
                    </span>
                  )}
                  {marca.totalProductos != null ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNumero(marca.totalProductos)}
                    </span>
                  ) : null}
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </section>
  )
}
