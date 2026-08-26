"use client"

import Link from "next/link"
import type { Route } from "next"
import { Store } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNombreComercial, formatNumero } from "@/lib/format"
import { useProveedores } from "@/modules/catalogo/hooks/use-productos"

import { SECTION_EMPTY_COPY, SectionEmpty } from "./section-empty"

/** Proveedores que caben en la grilla sin empujar la página. */
const MAX_VISIBLES = 10

/**
 * Grilla de acceso por PROVEEDOR — el eje de clasificación principal del
 * catálogo. Sustituye a la grilla de 10 categorías inventadas que enlazaba a
 * `/productos?categoria=…`: las categorías existen en el esquema del backend
 * pero no tienen datos, así que la única clasificación real es proveedor y
 * marca.
 *
 * Se muestran los de mayor catálogo (el API los devuelve alfabéticos, que en
 * cientos de proveedores no prioriza nada) con su conteo de referencias, y se
 * enlaza al listado ya filtrado. Sin datos la sección NO desaparece: mantiene
 * su encabezado y muestra un `SectionEmpty` — ver ese archivo.
 */
export function ProveedoresSection() {
  const { data, isPending, isError } = useProveedores()

  const destacados = (data ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_VISIBLES)

  const hayMas = (data?.length ?? 0) > destacados.length

  return (
    <section
      aria-labelledby="proveedores-grid-title"
      className="flex flex-col gap-8"
    >
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Explora por proveedor
            </p>
            <h2
              id="proveedores-grid-title"
              className="text-2xl font-bold tracking-tight text-balance sm:text-3xl"
            >
              Encuentra lo que tu operación necesita
            </h2>
          </div>
          {hayMas ? (
            <JdhButton
              asChild
              variant="ghost"
              className="shrink-0 self-start sm:self-auto"
            >
              <Link href="/productos">Ver todos los proveedores</Link>
            </JdhButton>
          ) : null}
        </div>
      </ScrollReveal>

      {isPending ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          aria-hidden="true"
        >
          {Array.from({ length: MAX_VISIBLES }, (_, i) => (
            <div
              key={i}
              className="h-[7.5rem] animate-pulse rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)]"
            />
          ))}
        </div>
      ) : isError ? (
        <SectionEmpty mensaje={SECTION_EMPTY_COPY.error} />
      ) : destacados.length === 0 ? (
        <SectionEmpty
          mensaje={SECTION_EMPTY_COPY.sinDatos("proveedores publicados")}
        />
      ) : (
        <Stagger
          staggerDelay={0.05}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {destacados.map((proveedor) => (
            <StaggerItem key={proveedor.id} className="h-full">
              <Link
                href={`/productos?proveedor=${proveedor.id}` as Route}
                className="group flex h-full flex-col gap-3 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="flex size-11 items-center justify-center rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)] text-foreground transition-transform duration-[var(--duration-fast)] group-hover:scale-110">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {formatNombreComercial(proveedor.nombre)}
                  </span>
                  {proveedor.totalProductos != null ? (
                    <span className="text-xs text-muted-foreground">
                      {formatNumero(proveedor.totalProductos)}{" "}
                      {proveedor.totalProductos === 1
                        ? "referencia"
                        : "referencias"}
                    </span>
                  ) : null}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  )
}
