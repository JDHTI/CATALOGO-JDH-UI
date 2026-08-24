"use client"

import * as React from "react"
import type { Route } from "next"
import Link from "next/link"
import { ChevronDown, LayoutGrid } from "lucide-react"

import { jdhButtonVariants } from "@/components/common/jdh-button"
import { megaMenuConfig } from "@/config/mega-menu.config"
import { modules } from "@/config/modules"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

/**
 * Trigger "Menú" + panel disclosure de la segunda barra (negra, igual que la
 * franja superior). Panel controlado (no Popover): `absolute top-full`
 * anclado al propio trigger, no un Popover de Radix — mismo patrón artesanal
 * que `CategoryDropdown`, a mayor escala. Se cierra con Escape (devuelve
 * foco), pointer-down fuera, y al navegar.
 *
 * El panel abarca el ANCHO COMPLETO de la barra (`absolute inset-x-0 top-full`
 * dentro del contenedor `relative` de `MainNav`) y cae sobre el contenido —
 * algo que un Popover flotante no logra limpiamente.
 *
 * Por debajo de `md` sigue siendo la única forma de alcanzar el catálogo por
 * categoría (no hay drawer). Contenido en dos bloques:
 * - Acceso general al módulo `catalogo` ("Productos" → /productos), como fila
 *   destacada arriba de la grilla.
 * - Grilla de categorías → subcategorías (mockeadas, ver `search.config.ts`
 *   vía `mega-menu.config.ts`), a varias columnas para aprovechar el ancho
 *   completo del panel en vez de una sola lista vertical angosta — cada
 *   columna es su propia categoría filtrable, con las subcategorías debajo
 *   como accesos más específicos.
 *
 * `listas`/`cuenta` (área de cliente) NO aparecen aquí a propósito — ver el
 * comentario en `mega-menu.config.ts`: ese login todavía no existe.
 * `favoritos`/`carrito` tampoco, porque ya tienen acceso directo por ícono en
 * `AppHeader` en cualquier ancho.
 */
export function MegaMenu() {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const { permissions } = useCurrentUser()
  const visibleIds = new Set(
    modules.visibleTo(permissions).map((mod) => mod.id)
  )

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    // Fragmento, sin wrapper posicionado: el panel se ancla al contenedor
    // `relative` de `MainNav` para poder abarcar todo el ancho de la barra.
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="mega-menu-panel"
        aria-label="Menú"
        onClick={() => setOpen((value) => !value)}
        // `px-2` alinea el contenedor del icono con el mismo margen izquierdo
        // que el teléfono de la ContactBar (que usa px-2) y que el enlace de
        // Promociones: los tres controles arrancan en el mismo eje.
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)]",
          open && "bg-[var(--overlay-on-dark-08)]"
        )}
      >
        <LayoutGrid className="size-[18px]" />
        {/* Solo icono en móvil: con "Explorar catálogo" y "Promociones" ya
            con texto explícito (ver MainNav), el label de "Menú" es el que
            se sacrifica para que los tres accesos quepan sin desbordar. */}
        <span className="hidden sm:inline">Menú</span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          id="mega-menu-panel"
          ref={panelRef}
          role="region"
          aria-label="Menú"
          className="absolute inset-x-0 top-full z-30 max-h-[70vh] overflow-y-auto overscroll-contain border-b border-border bg-popover text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
        >
          <div className="mx-auto flex max-w-[var(--container-wide)] flex-col gap-6 px-6 py-5 lg:flex-row lg:gap-8">
            {/* Bloque principal: acceso general + grilla de categorías. */}
            <div className="min-w-0 flex-1">
              {/* Módulos generales (hoy solo "catalogo") — fila destacada,
                  no una columna más: es el acceso a TODO el catálogo, distinto
                  en jerarquía de las categorías individuales de abajo. */}
              <div className="flex flex-wrap">
                {megaMenuConfig.moduleIds.map((id) => {
                  const mod = modules.byId(id)
                  if (!mod || !visibleIds.has(id)) return null
                  const Icon = mod.icon

                  return (
                    <Link
                      key={id}
                      href={mod.href as Route}
                      onClick={close}
                      className="flex items-center gap-3 rounded-md p-1.5 transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {mod.nav?.label ?? mod.title}
                        </span>
                        {mod.description ? (
                          <span className="line-clamp-1 block text-xs text-muted-foreground">
                            {mod.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  )
                })}
              </div>

              {/* Grilla de categorías: cada columna es su propia categoría
                  filtrable (encabezado enlazado a `?categoria=`) con sus
                  subcategorías debajo (`&subcategoria=`) — varias columnas en
                  paralelo para usar el ancho completo del panel en vez de una
                  sola lista vertical larga. Espaciado ajustado al mismo ritmo
                  compacto de la card `featured` (título → mt-1 → descripción
                  → mt-3 → botón) en vez del gap-5/mt-2 original, más suelto. */}
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                {megaMenuConfig.categoryColumns.map((column) => {
                  const Icon = column.icon

                  return (
                    <div key={column.id} className="min-w-0">
                      <Link
                        href={column.href as Route}
                        onClick={close}
                        className="flex items-center gap-2 rounded-md text-sm font-medium outline-none hover:underline focus-visible:underline"
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {column.label}
                      </Link>
                      <ul className="mt-1 space-y-1">
                        {column.subcategories.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href as Route}
                              onClick={close}
                              className="block rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>

            {megaMenuConfig.featured ? (
              <div className="flex shrink-0 flex-col self-start rounded-[var(--jdh-radius-md)] border border-transparent bg-primary p-4 text-primary-foreground lg:w-64 dark:border-[var(--color-ink-border)]">
                <p className="text-sm font-medium">
                  {megaMenuConfig.featured.title}
                </p>
                <p className="mt-1 text-xs text-[var(--color-on-ink-muted)]">
                  {megaMenuConfig.featured.description}
                </p>
                <Link
                  href={megaMenuConfig.featured.href as Route}
                  onClick={close}
                  className={cn(
                    jdhButtonVariants({
                      variant: "primary-on-ink",
                      size: "sm",
                    }),
                    "mt-3 self-start"
                  )}
                >
                  {megaMenuConfig.featured.cta}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
