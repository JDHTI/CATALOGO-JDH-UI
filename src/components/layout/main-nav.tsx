"use client"

import type { Route } from "next"
import Link from "next/link"
import { Compass, Tag } from "lucide-react"

import { useMarcas } from "@/modules/catalogo/hooks/use-productos"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

/** Accesos que caben en la barra sin scroll horizontal. */
const MAX_ACCESOS = 6

/**
 * Barra del menú — mismo chrome negro que `ContactBar` y `AppHeader` (ver
 * ahí: "las tres franjas son el mismo chrome"), separada de la barra
 * principal por una línea hairline `--color-ink-border`. Navegación: el
 * trigger "Menú" del mega menú, junto a él "Explorar catálogo" (acceso
 * directo a `/productos`, el hub completo); accesos directos a las MARCAS
 * con más referencias, a texto plano sin iconos; y "Promociones" lockeado a
 * la derecha — icono + label reservado a estos dos accesos y al trigger
 * "Menú", como distintivo de los controles principales de la barra.
 *
 * En pantallas angostas (`<sm`) "Explorar catálogo" y "Promociones" pierden
 * el label y quedan en solo-icono: con "Menú" + los tres labels completos no
 * caben en el ancho mínimo soportado (320px).
 *
 * Los accesos salían de una lista de 10 categorías inventadas en
 * `search.config.ts` que enlazaban a `/productos?categoria=…`, un filtro que
 * no existe en los datos reales. Ahora salen del API (`GET /brands`): la
 * marca es el eje con el que un comprador reconoce el portafolio de un
 * vistazo (el otro eje, proveedor, vive en la grilla del homepage y en el
 * panel de filtros). La lista se cachea 5 minutos y el nav mantiene su
 * altura fija, así que no hay salto de layout; si el API no responde, la
 * columna central queda vacía en lugar de mostrar destinos falsos.
 *
 * `relative` porque el panel del mega menú (`MegaMenu`) se ancla aquí con
 * `absolute inset-x-0 top-full`.
 *
 * Layout de 3 columnas (`auto_1fr_auto`): "Menú" + "Explorar catálogo" a la
 * izquierda, las marcas destacadas en la columna central (justificadas al
 * centro) y "Promociones" lockeado a la derecha.
 */
export function MainNav({ className }: { className?: string }) {
  const { data: marcas } = useMarcas()

  // Las de mayor catálogo primero: con cientos de marcas, el orden
  // alfabético del API no dice nada en una barra de 6 accesos.
  const destacados = (marcas ?? [])
    .slice()
    .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
    .slice(0, MAX_ACCESOS)

  return (
    <div
      className={cn(
        "relative border-t border-[var(--color-ink-border)] bg-[var(--color-ink)] text-[var(--color-on-ink)]",
        className
      )}
    >
      <nav
        aria-label="Menú"
        className="mx-auto grid h-14 max-w-[var(--container-wide)] grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:px-6"
      >
        <div className="flex shrink-0 items-center gap-1">
          <MegaMenu />
          <Link
            href="/productos"
            aria-label="Explorar catálogo"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Compass className="size-4" aria-hidden />
            <span className="hidden sm:inline">Explorar catálogo</span>
          </Link>
        </div>

        {/* Marcas con más referencias — vacío mientras carga o si falla.
            Oculto por debajo de `lg`: entre "Explorar catálogo" y
            "Promociones" no queda ancho para seis nombres de marca, y al no
            encoger se montaban unos sobre otros. En pantallas estrechas el
            acceso al catálogo va por el mega menú y la barra inferior. */}
        <div className="hidden min-w-0 items-center gap-1 justify-self-center lg:flex">
          {destacados.map((marca) => (
            <Link
              key={marca.id}
              href={`/productos?marca=${marca.id}` as Route}
              className="inline-flex h-9 max-w-[12rem] shrink-0 items-center truncate rounded-lg px-3 text-sm font-medium text-[var(--color-on-ink-muted)] transition-colors hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)]"
            >
              {formatNombreComercial(marca.nombre)}
            </Link>
          ))}
        </div>

        {/* Promociones — lockeado al extremo derecho, fuera del scroll. */}
        <div className="flex shrink-0 items-center gap-1 justify-self-end">
          <span
            aria-hidden
            className="mx-1 h-6 w-px bg-[var(--color-ink-border)]"
          />
          <Link
            href={"/productos?promocion=1" as Route}
            aria-label="Promociones"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Tag className="size-4" aria-hidden />
            <span className="hidden sm:inline">Promociones</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
