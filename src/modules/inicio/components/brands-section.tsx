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

/**
 * En MÓVIL (<`sm`) la grilla no crece hacia abajo: se fija en TRES FILAS y
 * fluye por columnas, así que la vitrina mide 3×3 y se pagina con scroll
 * horizontal. Con 30 marcas en 2 columnas eran 15 filas de logos — una pared
 * que nadie recorre. Las columnas miden exactamente un tercio del scrollport
 * (`auto-cols-[33.333%]`), y por eso el contenedor de la grilla TIENE que ser
 * también el que desplaza: el porcentaje resuelve contra su ancho visible.
 * Desde `sm` vuelve a fluir por filas (3 → 4 → 5 columnas).
 */
const CLASES_GRILLA =
  "no-scrollbar grid snap-x snap-mandatory auto-cols-[33.333%] grid-flow-col grid-rows-3 overflow-x-auto overscroll-x-contain rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none sm:overflow-hidden md:grid-cols-4 lg:grid-cols-5"
const CLASES_CELDA =
  "flex h-full min-h-[7rem] snap-start flex-col items-center justify-center gap-2 px-3 py-6 text-center shadow-[1px_0_0_0_var(--color-border),0_1px_0_0_var(--color-border)] sm:min-h-[8.5rem] sm:px-4"

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
 * En móvil la misma grilla se lee como vitrina 3×3 paginada en horizontal —
 * ver `CLASES_GRILLA`.
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
          <div
            className={CLASES_GRILLA}
            aria-hidden="true"
            data-lenis-prevent=""
          >
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
        <Stagger
          staggerDelay={0.03}
          className={CLASES_GRILLA}
          data-lenis-prevent=""
        >
          {marcas.map((marca) => (
            <StaggerItem key={marca.id} className="h-full snap-start">
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
