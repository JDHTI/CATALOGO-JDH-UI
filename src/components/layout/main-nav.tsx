"use client"

import Link from "next/link"
import { Compass, Tag } from "lucide-react"

import { useDesbordados } from "@/hooks/use-desbordados"
import { useCategorias } from "@/modules/catalogo/hooks/use-productos"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { categoriaHref } from "@/modules/catalogo/navigation"

import { MegaMenu } from "./mega-menu"

/** Candidatas a la barra. Se pintan todas y se muestran las que quepan. */
const MAX_ACCESOS = 10

/**
 * Barra inferior del header: las categorías principales, alineadas con el
 * buscador. Antes mostraba marcas; las categorías describen mejor un catálogo
 * de menaje, aseo y dotación, y son pocas, así que la barra no depende de
 * elegir 8 entre cientos.
 *
 * Se muestran SOLO las que caben completas en el renglón (`useDesbordados`):
 * el ancho de la columna cambia con la ventana y los nombres no miden lo
 * mismo, así que un número fijo dejaba nombres cortados o huecos.
 */
export function MainNav({ className }: { className?: string }) {
  const { data: categorias } = useCategorias()

  // Las de mayor catálogo primero: son las que más gente busca, y el orden
  // del API es el de navegación, no el de peso.
  const destacadas = (categorias ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_ACCESOS)

  const [filaRef, visibles] = useDesbordados<HTMLDivElement>([
    destacadas.map((c) => c.id).join(),
  ])

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

        {/* Alto fijo + `flex-wrap` + `overflow-hidden`: lo que no cabe baja a
            un segundo renglón que no se ve, y el hook lo marca `invisible`
            para que tampoco se alcance con Tab. */}
        <div
          ref={filaRef}
          className="hidden h-9 min-w-0 flex-wrap justify-center gap-x-1 overflow-hidden lg:flex"
        >
          {destacadas.map((categoria, i) => (
            <Link
              key={categoria.id}
              href={categoriaHref(categoria)}
              className={cn(
                "inline-flex h-9 max-w-[12rem] shrink-0 items-center rounded-lg px-2 text-sm font-medium whitespace-nowrap text-[var(--color-on-ink-muted)] transition-colors hover:bg-transparent hover:text-[var(--color-on-ink)]",
                visibles !== null && i >= visibles && "invisible"
              )}
            >
              <span className="truncate">
                {formatNombreComercial(categoria.nombre)}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1 justify-self-end">
          <span
            aria-hidden
            className="mx-1 hidden h-6 w-px bg-[var(--color-ink-border)] lg:block"
          />
          <Link
            href="/promociones"
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
