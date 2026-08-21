"use client"

import type { Route } from "next"
import Link from "next/link"
import { Tag } from "lucide-react"

import { navCategoryLinks } from "@/config/search.config"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

/**
 * Barra del menú — mismo chrome negro que `ContactBar` y `AppHeader` (ver
 * ahí: "las tres franjas son el mismo chrome"), separada de la barra
 * principal por una línea hairline `--color-ink-border`. Solo navegación:
 * el trigger "Menú" del mega menú + accesos a categorías destacadas
 * (mockeadas, ver `search.config.ts`), a texto plano sin iconos — el icono
 * queda reservado al trigger "Menú" y al acceso de Promociones.
 *
 * `relative` porque el panel del mega menú (`MegaMenu`) se ancla aquí con
 * `absolute inset-x-0 top-full`.
 *
 * Layout de 3 columnas SIMÉTRICAS (`auto_1fr_auto`): el trigger "Menú" a la
 * izquierda, el grupo de categorías destacadas en la columna central
 * (justificado al centro, con scroll horizontal en móvil si no caben) y
 * "Promociones" lockeado a la derecha — el grupo central queda centrado con
 * respecto al espacio entre "Menú" y "Promociones". En el extremo derecho,
 * fuera del scroll, Promociones nunca se mueve.
 */
export function MainNav({ className }: { className?: string }) {
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

        {/* Categorías que caben sin scroll (8) — ver search.config.ts. */}
        <div className="flex min-w-0 items-center gap-1 justify-self-center">
          {navCategoryLinks.map((category) => (
            <Link
              key={category.value}
              href={`/productos?categoria=${category.value}` as Route}
              className="inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-[var(--color-on-ink-muted)] transition-colors hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)]"
            >
              {category.label}
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
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Tag className="size-4" aria-hidden />
            Promociones
            <span className="inline-flex h-5 items-center rounded-full bg-[var(--color-on-ink)] px-2 text-[10px] font-medium text-[var(--color-ink)]">
              Oferta
            </span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
