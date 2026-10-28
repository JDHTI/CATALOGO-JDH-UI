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
import { MegaMenuCatalogo } from "./mega-menu-catalogo"

/**
 * Trigger "Menú" + panel disclosure de la segunda barra (negra, igual que la
 * franja superior). Panel controlado (no Popover): `absolute top-full`
 * anclado al propio trigger, no un Popover de Radix, por el patrón artesanal
 * de disclosure controlado. Se cierra con Escape (devuelve foco),
 * pointer-down fuera, y al navegar.
 *
 * El panel abarca el ANCHO COMPLETO de la barra (`absolute inset-x-0 top-full`
 * dentro del contenedor `relative` de `MainNav`) y cae sobre el contenido —
 * algo que un Popover flotante no logra limpiamente.
 *
 * Por debajo de `md` sigue siendo la única forma de listar los módulos (no
 * hay drawer), así que sus grupos cubren cada módulo registrado 1:1 con
 * `src/config/modules.ts`. El ancho se acota al viewport
 * (`calc(100vw-2rem)`) para que no se salga en pantallas angostas.
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
        // El label visible desaparece en móvil (ver `MainNav`: los otros dos
        // accesos de la franja llevan texto completo siempre), así que aquí el
        // nombre accesible tiene que ser explícito.
        aria-label="Menú"
        onClick={() => setOpen((value) => !value)}
        // `px-2` alinea el contenedor del icono con el mismo margen izquierdo
        // que el teléfono de la ContactBar (que usa px-2) y que el enlace de
        // Promociones: los tres controles arrancan en el mismo eje.
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--color-on-ink)] transition-colors hover:bg-[var(--overlay-on-dark-08)] sm:gap-2",
          open && "bg-[var(--overlay-on-dark-08)]"
        )}
      >
        <LayoutGrid className="size-[18px] shrink-0" />
        {/* Solo-icono en móvil: es el trigger más reconocible por su icono y
            el ancho que se libera es el que necesitan "Explorar catálogo" y
            "Promociones" para mostrar su texto completo a 320px. */}
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
          // El tope es la pantalla que queda bajo la barra, no un 70vh fijo:
          // el contenido está pensado para caber entero (ver
          // `MegaMenuCatalogo`) y el scroll es solo la red de seguridad para
          // ventanas muy bajas. Bajo `md` se descuenta además la barra
          // inferior de la app (4.5rem), que si no tapa el final del panel.
          className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-var(--catalogo-chrome-height)-4.5rem)] overflow-y-auto overscroll-contain border-b border-border bg-popover text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 md:max-h-[calc(100dvh-var(--catalogo-chrome-height))]"
        >
          <div className="mx-auto grid max-w-[var(--container-wide)] gap-3 px-6 py-3">
            <MegaMenuCatalogo onNavigate={close} />

            {/* Accesos secundarios en UNA franja, no en columnas: antes cada
                grupo y la tarjeta destacada sumaban alto al menú. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-2">
              {megaMenuConfig.groups.flatMap((group) => [
                ...(group.moduleIds ?? []).map((id) => {
                  const mod = modules.byId(id)
                  if (!mod || !visibleIds.has(id)) return null
                  const Icon = mod.icon

                  return (
                    <Link
                      key={`${group.id}-${id}`}
                      href={mod.href as Route}
                      onClick={close}
                      className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {mod.nav?.label ?? mod.title}
                    </Link>
                  )
                }),
                ...(group.links ?? []).map((link) => (
                  <Link
                    key={`${group.id}-${link.href}`}
                    href={link.href as Route}
                    onClick={close}
                    className="rounded-md px-1.5 py-1 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                  >
                    {link.label}
                  </Link>
                )),
              ])}

              {megaMenuConfig.featured ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:ml-auto">
                  <p className="text-sm">
                    <span className="font-medium">
                      {megaMenuConfig.featured.title}.
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {megaMenuConfig.featured.description}
                    </span>
                  </p>
                  <Link
                    href={megaMenuConfig.featured.href as Route}
                    onClick={close}
                    className={cn(
                      jdhButtonVariants({ variant: "primary", size: "sm" })
                    )}
                  >
                    {megaMenuConfig.featured.cta}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
