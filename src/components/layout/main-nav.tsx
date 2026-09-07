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
 * ahí: "las tres franjas son el mismo chrome"). `AppHeader` aporta la única
 * línea hairline que separa ambas barras, evitando que dos bordes contiguos
 * formen un divisor de 2px. Navegación: el
 * trigger "Menú" del mega menú, junto a él "Explorar catálogo" (acceso
 * directo a `/productos`, el hub completo); accesos directos a las MARCAS
 * con más referencias, a texto plano sin iconos; y "Promociones" lockeado a
 * la derecha — icono + label reservado a estos dos accesos y al trigger
 * "Menú", como distintivo de los controles principales de la barra.
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
 * LAYOUT — flex en todos los anchos, con un solo interruptor por breakpoint.
 * "Menú" es siempre el primer hijo, así que queda pegado al límite izquierdo
 * de la franja sin depender de ninguna columna. El resto va en un grupo
 * `flex-1` que se reparte de dos maneras:
 *
 * - Bajo `lg` las marcas están ocultas, así que el grupo tiene solo dos
 *   hijos visibles y `justify-evenly` los reparte con la MISMA distancia
 *   entre "Menú", "Explorar catálogo", "Promociones" y el borde derecho —
 *   una fila de tres accesos equidistantes, sin divisores.
 * - Desde `lg` entra la columna de marcas (`flex-1 justify-center`), que
 *   absorbe todo el espacio sobrante: "Explorar catálogo" vuelve a quedar
 *   junto a "Menú", las marcas centradas y "Promociones" lockeado al extremo
 *   derecho, ya con su divisor.
 *
 * Un grid de 3 columnas NO sirve bajo `lg`: aunque "Menú" y "Explorar
 * catálogo" se alineen al inicio de su propia columna, cada uno queda
 * anclado al borde de una franja de ancho fijo, y entre ellos aparece el
 * espacio muerto de esa franja sin importar el `justify-self`.
 *
 * Los TRES accesos llevan texto completo desde `sm`; el que se sacrifica a
 * solo-icono en móvil es "Menú" (ver `MegaMenu`): es el trigger más
 * reconocible por su icono (`LayoutGrid`) y el que menos necesita el label.
 * En el ancho mínimo soportado (320px) el label de "Explorar catálogo" es lo
 * único que puede encogerse (`truncate`) — antes que empujar la página a
 * scroll horizontal.
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
        "relative bg-[var(--color-ink)] text-[var(--color-on-ink)]",
        className
      )}
    >
      <nav
        aria-label="Menú"
        className="mx-auto flex h-14 max-w-[var(--container-wide)] items-center px-4 sm:px-6"
      >
        <MegaMenu />

        <div className="flex min-w-0 flex-1 items-center justify-evenly lg:justify-start">
          <Link
            href="/productos"
            className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
          >
            <Compass className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Explorar catálogo</span>
          </Link>

          {/* Marcas con más referencias — vacío mientras carga o si falla.
              Oculto por debajo de `lg`: entre "Explorar catálogo" y
              "Promociones" no queda ancho para seis nombres de marca, y al no
              encoger se montaban unos sobre otros. En pantallas estrechas el
              acceso al catálogo va por el mega menú y la barra inferior.
              Desde `lg`, `flex-1` lo convierte en el fuelle de la franja. */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
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

          {/* Promociones — al extremo derecho de la franja. El divisor solo
              tiene sentido pegado al borde de la columna de marcas; bajo `lg`
              no hay nada de lo que separarlo y la fila se lee mejor limpia. */}
          <div className="flex shrink-0 items-center gap-1">
            <span
              aria-hidden
              className="mx-1 hidden h-6 w-px bg-[var(--color-ink-border)] lg:block"
            />
            <Link
              href={"/productos?promocion=1" as Route}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]"
            >
              <Tag className="size-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">Promociones</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
