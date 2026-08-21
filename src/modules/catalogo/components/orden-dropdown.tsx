"use client"

import * as React from "react"
import { ArrowUpDown, Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

import { ordenOpciones, type OrdenCatalogo } from "../types"

/**
 * Dropdown PERSONALIZADO de ordenamiento (Relevancia / Menor precio / Mayor
 * precio / Nombre A–Z): un trigger tipo pill con el valor activo + chevron,
 * y un panel flotante con las opciones (check en la activa). Se cierra al
 * seleccionar, con Escape (devuelve foco) y al hacer click fuera — mismo
 * patrón artesanal que `MegaMenu`/`CategoryDropdown`.
 */
export function OrdenDropdown({
  value,
  onChange,
}: {
  value: OrdenCatalogo
  onChange: (orden: OrdenCatalogo) => void
}) {
  const [abierto, setAbierto] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!abierto) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAbierto(false)
        triggerRef.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      setAbierto(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [abierto])

  const actual =
    ordenOpciones.find((o) => o.value === value) ?? ordenOpciones[0]

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ArrowUpDown className="size-4" aria-hidden="true" />
        {actual.label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-[var(--duration-base)]",
            abierto && "rotate-180"
          )}
        />
      </button>

      {abierto ? (
        <div
          role="listbox"
          aria-label="Ordenar productos"
          className="absolute top-full right-0 z-30 mt-2 w-56 rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {ordenOpciones.map((opcion) => {
            const activa = opcion.value === value
            return (
              <button
                key={opcion.value}
                type="button"
                role="option"
                aria-selected={activa}
                onClick={() => {
                  onChange(opcion.value)
                  setAbierto(false)
                  triggerRef.current?.focus()
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  activa
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                  "hover:bg-accent hover:text-foreground"
                )}
              >
                {opcion.label}
                {activa ? (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
