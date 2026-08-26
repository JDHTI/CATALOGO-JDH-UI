"use client"

import Link from "next/link"
import type { Route } from "next"

import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNombreComercial } from "@/lib/format"
import {
  LogoComercial,
  LogoComercialVacio,
} from "@/modules/catalogo/components/logo-comercial"
import { useMarcas } from "@/modules/catalogo/hooks/use-productos"

import { SECTION_EMPTY_COPY, SectionNota } from "./section-empty"

/** Marcas que caben en la grilla (5 columnas × 6 filas en desktop). */
const MAX_VISIBLES = 30
/** Celdas de la grilla fantasma: una fila y media, sin inflar la página. */
const FANTASMAS = 10

const CLASES_GRILLA =
  "grid grid-cols-2 overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
const CLASES_CELDA =
  "flex h-full min-h-[8.5rem] flex-col items-center justify-center gap-2 px-4 py-6 text-center shadow-[1px_0_0_0_var(--color-border),0_1px_0_0_var(--color-border)]"

/**
 * Grilla de MARCAS del catálogo, con hairline-grid (gap-px sobre borde):
 * cada celda enlaza al listado filtrado por esa marca. Las marcas son el
 * SEGUNDO eje de clasificación real y son distintas de los proveedores: un
 * proveedor distribuye varias marcas.
 *
 * La celda reserva el espacio del LOGO y lo resuelve con `LogoComercial`:
 * el `logoUrl` del backend, y si no hay, el monograma. El hueco mide igual
 * en ambos casos, así que la grilla ya está lista para recibir los logos sin
 * rehacerse.
 *
 * La celda muestra SOLO logo y nombre: el conteo de productos por marca se
 * retiró de esta grilla a propósito. Es una vitrina de marcas, no un cuadro
 * de inventario, y el número competía con el logo por la atención.
 *
 * Sin datos se dibuja la misma grilla en fantasma; solo desaparece del todo
 * si el backend no publica `/brands` (404), porque entonces el eje marca aún
 * no existe como concepto y anunciarlo confundiría.
 */
export function BrandsSection() {
  const { data, isPending, isError, noImplementado } = useMarcas()

  const marcas = (data ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_VISIBLES)

  if (noImplementado) return null

  const sinContenido = !isPending && marcas.length === 0

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

      {isPending || sinContenido || isError ? (
        <div className="flex flex-col gap-4">
          <div className={CLASES_GRILLA} aria-hidden="true">
            {Array.from({ length: FANTASMAS }, (_, i) => (
              <div key={i} className={CLASES_CELDA}>
                <LogoComercialVacio className="size-12" />
                <span className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
              </div>
            ))}
          </div>
          {!isPending ? (
            <SectionNota
              mensaje={
                isError
                  ? SECTION_EMPTY_COPY.error
                  : SECTION_EMPTY_COPY.sinDatos("logos de marca")
              }
            />
          ) : null}
        </div>
      ) : (
        <Stagger staggerDelay={0.03} className={CLASES_GRILLA}>
          {marcas.map((marca) => (
            <StaggerItem key={marca.id} className="h-full">
              <Link
                href={`/productos?marca=${marca.id}` as Route}
                className={`transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${CLASES_CELDA}`}
              >
                <LogoComercial
                  nombre={marca.nombre}
                  logoUrl={marca.logoUrl}
                  sizes="64px"
                  className="size-14"
                />
                <span className="line-clamp-2 text-xs font-medium">
                  {formatNombreComercial(marca.nombre)}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  )
}
