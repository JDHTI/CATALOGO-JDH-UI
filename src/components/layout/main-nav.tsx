"use client"

import type { Route } from "next"
import Link from "next/link"

import { useMarcas } from "@/modules/catalogo/hooks/use-productos"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

/** Accesos que caben en la barra sin scroll horizontal. */
const MAX_ACCESOS = 6

/**
 * Barra del menú — mismo chrome negro que `ContactBar` y `AppHeader` (ver
 * ahí: "las tres franjas son el mismo chrome"), separada de la barra
 * principal por una línea hairline `--color-ink-border`. Solo navegación:
 * el trigger "Menú" del mega menú + accesos directos a las MARCAS con más
 * referencias, a texto plano sin iconos — el icono queda reservado al
 * trigger "Menú".
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
 * Layout de 3 columnas (`auto_1fr_auto`): el trigger "Menú" a la izquierda,
 * los accesos en la columna central (justificados al centro) y el enlace a
 * todo el catálogo lockeado a la derecha.
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
        <MegaMenu />

        {/* Marcas con más referencias — vacío mientras carga o si falla.
            Oculto por debajo de `lg`: entre "Menú" y "Todo el catálogo" no
            queda ancho para seis nombres de marca, y al no encoger se
            montaban unos sobre otros. En pantallas estrechas el acceso al
            catálogo va por el mega menú y la barra inferior. */}
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

        {/* Todo el catálogo — lockeado al extremo derecho. */}
        <div className="flex shrink-0 items-center gap-1 justify-self-end">
          <span
            aria-hidden
            className="mx-1 h-6 w-px bg-[var(--color-ink-border)]"
          />
          <Link
            href="/productos"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            Todo el catálogo
          </Link>
        </div>
      </nav>
    </div>
  )
}
