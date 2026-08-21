"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { searchCategoryOptions } from "@/config/search.config"
import { cn } from "@/lib/utils"

interface CategoryDropdownProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Dropdown a medida para el segmento de categoría del buscador doble — no es
 * un `<select>` nativo ni el `Select` de Radix (`JdhSelect`): un `<select>`
 * dentro de una caja de buscador fundida no se puede pintar por completo con
 * CSS (el popup lo dibuja el sistema operativo), y un trigger de Radix arrastra
 * posicionamiento de popover que no hace falta en un panel tan simple. Mismo
 * patrón de disclosure controlado que `MegaMenu` (Escape, click fuera, cierre
 * al elegir), a una escala mucho más pequeña.
 */
export function CategoryDropdown({
  value,
  onChange,
  className,
}: CategoryDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const selected =
    searchCategoryOptions.find((option) => option.value === value) ??
    searchCategoryOptions[0]

  React.useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-full items-center gap-1.5 px-3 text-sm text-[var(--color-on-paper-muted)] outline-none transition-colors hover:text-[var(--color-on-paper)]"
      >
        <span className="max-w-[9rem] truncate">{selected.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Categoría"
          // Alineado al borde izquierdo del trigger (`left-0`) y del mismo
          // ancho (`w-full`), para que el panel coincida exactamente con el
          // control que lo despliega. `mt-3` lo separa del ícono de flecha en
          // vez de dejarlo pegado al borde inferior del buscador.
          className="absolute top-full left-0 z-[var(--z-dropdown)] mt-3 w-full min-w-52 overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
        >
          {searchCategoryOptions.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                    active && "font-medium"
                  )}
                >
                  <Check className={cn("size-4 shrink-0", !active && "invisible")} />
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
