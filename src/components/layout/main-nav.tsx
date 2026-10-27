"use client"

import type { Route } from "next"
import Link from "next/link"
import { Compass, Tag } from "lucide-react"

import { useProveedores } from "@/modules/catalogo/hooks/use-productos"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

const MAX_ACCESOS = 8

/** Ocho proveedores destacados alineados con el buscador; deslizables si no caben. */
export function MainNav({ className }: { className?: string }) {
  const { data: proveedores } = useProveedores()

  // Los de mayor catálogo primero: con cientos de proveedores, el orden
  // alfabético del API no dice nada en una barra de 8 accesos.
  const destacados = (proveedores ?? [])
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

        <div className="hidden min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto lg:flex [&::-webkit-scrollbar]:hidden">
          {destacados.map((proveedor) => (
            <Link
              key={proveedor.id}
              href={
                `/productos?proveedor=${encodeURIComponent(proveedor.id)}` as Route
              }
              className="inline-flex h-9 max-w-[9rem] shrink-0 items-center truncate rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink-muted)] transition-colors first:ml-auto last:mr-auto hover:bg-transparent hover:text-[var(--color-on-ink)]"
            >
              {formatNombreComercial(proveedor.nombre)}
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1 justify-self-end">
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
