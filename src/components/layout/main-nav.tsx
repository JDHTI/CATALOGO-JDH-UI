"use client"

import type { Route } from "next"
import Link from "next/link"
import { Compass, Tag } from "lucide-react"

import { navCategoryLinks } from "@/config/search.config"
import { cn } from "@/lib/utils"

import { MegaMenu } from "./mega-menu"

/**
 * Barra del menú — mismo chrome negro que `ContactBar` y `AppHeader` (ver
 * ahí: "las tres franjas son el mismo chrome"), separada de la barra
 * principal por una línea hairline `--color-ink-border`. Solo navegación:
 * el trigger "Menú" del mega menú, "Explorar catálogo", categorías
 * destacadas (mockeadas, ver `search.config.ts`, a texto plano sin icono) y
 * "Promociones" — icono + label para los tres accesos principales.
 *
 * `relative` porque el panel del mega menú (`MegaMenu`) se ancla aquí con
 * `absolute inset-x-0 top-full`.
 *
 * Layout RESPONSIVE con dos mecanismos distintos a propósito (un grid de 3
 * columnas de igual ancho NO sirve bajo `md`: aunque "Menú" y "Explorar
 * catálogo" se alineen ambos al inicio de su propia columna, cada uno sigue
 * anclado al borde de una franja de ancho fijo —1/3 de la barra— así que
 * entre ellos queda el espacio muerto de esa franja, no importa el
 * `justify-self` de cada uno):
 * - Bajo `md`: `flex justify-between` con SOLO DOS hijos reales — un grupo
 *   `{Menú, Explorar catálogo}` (su propio `flex gap-5`, un respiro visible
 *   pero sin la franja de ancho fijo de un grid de columnas) y "Promociones".
 *   `justify-between` empuja el grupo al límite izquierdo y "Promociones" al
 *   límite derecho — el máximo espacio posible entre "Explorar catálogo" y
 *   "Promociones" queda garantizado por construcción.
 * - Desde `md`: el grupo pasa a `display: contents` (`md:contents`) —
 *   desaparece como caja y sus dos hijos ("Menú", "Explorar catálogo" +
 *   categorías) vuelven a ser hijos DIRECTOS de `nav`, que en este punto ya
 *   es `md:grid md:grid-cols-[auto_1fr_auto]`: "Menú" a la izquierda,
 *   columna central `justify-self-stretch` (ocupa todo el ancho disponible)
 *   y "Promociones" lockeado a la derecha.
 *
 * SIEMPRE EXACTAMENTE 3 accesos: "Menú" (mega menú), "Explorar catálogo"
 * (acceso directo a `/productos`) y "Promociones". Solo iconos resultaba
 * poco intuitivo en móvil, pero mostrar los TRES labels completos no cabe en
 * el ancho mínimo soportado (320px) — así que "Explorar catálogo" y
 * "Promociones" llevan texto explícito SIEMPRE (nunca se ocultan) y "Menú"
 * es el que se sacrifica a solo-icono bajo `sm` (su label reaparece desde
 * `sm`, ver `MegaMenu`): es el trigger más reconocible por icono solo
 * (`LayoutGrid`) y el que menos necesita el label para entenderse.
 *
 * Dentro de la columna central, "Explorar catálogo" es `shrink-0` (primer
 * hijo del flex) y las categorías destacadas (mockeadas, ver
 * `search.config.ts`, un CUARTO grupo solo desde `md`, a tamaño más chico
 * —h-8, texto xs— para leerse como acceso secundario) son el hijo `flex-1
 * justify-center`: se centran en el espacio que sobra entre "Explorar
 * catálogo" y "Promociones". Ese grupo mantiene su propio scrollport
 * horizontal (`overflow-x-auto`, barra oculta) por si no cabe entre `md` y
 * el ancho en que las 8 entran sin scroll (`lg`).
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
        className="mx-auto flex h-14 max-w-[var(--container-wide)] items-center justify-between gap-1 px-4 sm:px-6 md:grid md:grid-cols-[auto_1fr_auto]"
      >
        {/* Grupo móvil "Menú" + "Explorar catálogo": una sola caja flex bajo
            `md` (por eso quedan pegados de verdad), que se disuelve desde
            `md` (`contents`) para que ambos hijos vuelvan a ser columnas
            independientes del grid — ver comentario del componente. */}
        <div className="flex items-center gap-8 md:contents">
          <div className="md:justify-self-start">
            <MegaMenu />
          </div>

          <div className="flex min-w-0 items-center gap-1 md:justify-self-stretch md:justify-start">
            <Link
              href={"/productos" as Route}
              aria-label="Explorar catálogo"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
            >
              <Compass className="size-4" aria-hidden />
              <span>Explorar catálogo</span>
            </Link>

            {/* Categorías: cuarto grupo, ocultas bajo `md`, a tamaño reducido
                frente a "Explorar catálogo". `flex-1 justify-center` las centra
                en el espacio sobrante hacia "Promociones" en vez de quedar
                pegadas a "Explorar catálogo". Caben sin scroll desde `lg` (8)
                — entre `md` y `lg`, scroll horizontal propio con la barra
                oculta (ver search.config.ts). */}
            <span
              aria-hidden
              className="hidden h-4 w-px shrink-0 bg-[var(--color-ink-border)] md:block"
            />
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
              {navCategoryLinks.map((category) => (
                <Link
                  key={category.value}
                  href={`/productos?categoria=${category.value}` as Route}
                  className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-xs font-medium text-[var(--color-on-ink-muted)] transition-colors hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)]"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Promociones — bajo `md` queda al límite derecho por `justify-between`
            en `nav` (segundo y único otro hijo real de la franja); desde `md`
            es la tercera columna del grid, lockeada a la derecha. El
            separador solo tiene sentido pegado al borde de la columna
            central en desktop; bajo `md` no hay nada a lo que separar. */}
        <div className="flex shrink-0 items-center gap-1 md:justify-self-end">
          <span
            aria-hidden
            className="mx-1 hidden h-6 w-px bg-[var(--color-ink-border)] md:block"
          />
          <Link
            href={"/productos?promocion=1" as Route}
            aria-label="Promociones"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Tag className="size-4" aria-hidden />
            <span>Promociones</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
