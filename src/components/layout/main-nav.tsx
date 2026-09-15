"use client"

import type { Route } from "next"
import Link from "next/link"
import { Compass, Tag } from "lucide-react"

import { useMarcas } from "@/modules/catalogo/hooks/use-productos"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

const MAX_ACCESOS = 8

/** Ocho marcas destacadas alineadas con el buscador; deslizables si no caben. */
export function MainNav({ className }: { className?: string }) {
  const { data: marcas } = useMarcas()

  // Las de mayor catálogo primero: con cientos de marcas, el orden
  // alfabético del API no dice nada en una barra de 8 accesos.
  const destacados = (marcas ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_ACCESOS)

  return (
    <div
      className={cn(
        "relative bg-[var(--color-ink)] text-[var(--color-on-ink)]",
        className
      )}
    >
      <nav
        aria-label="Menú"
        className="mx-auto grid h-14 max-w-[var(--container-wide)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_22rem]"
      >
        <div className="flex min-w-0 items-center gap-1">
          <MegaMenu />

          <Link
            href="/productos"
            className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Compass className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Explorar catálogo</span>
          </Link>
        </div>

          <div className="hidden min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden">
            {destacados.map((marca) => (
              <Link
                key={marca.id}
                href={`/productos?marca=${marca.id}` as Route}
                className="inline-flex h-9 max-w-[9rem] shrink-0 items-center truncate rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink-muted)] transition-colors first:ml-auto last:mr-auto hover:bg-transparent hover:text-[var(--color-on-ink)]"
              >
                {formatNombreComercial(marca.nombre)}
              </Link>
            ))}
          </div>

          <div className="flex min-w-0 shrink-0 items-center justify-self-end gap-1">
            <span
              aria-hidden
              className="mx-1 hidden h-6 w-px bg-[var(--color-ink-border)] lg:block"
            />
            <Link
              href={"/productos?promocion=1" as Route}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-transparent"
            >
              <Tag className="size-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Promociones</span>
            </Link>
          </div>
      </nav>
    </div>
  )
}
