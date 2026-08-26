"use client"

import { RotateCcw, SlidersHorizontal, Store } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { cn } from "@/lib/utils"

import type { Proveedor } from "../types"

/**
 * Panel de filtros del listado conectado — mantiene el lenguaje visual del
 * panel original (bloque NEGRO fijo con contenido en blanco fijo, sin
 * alternar con el tema), pero con el único criterio real del API: el
 * PROVEEDOR (clasificación principal del catálogo). `GET /products` acepta
 * un solo `supplierId`, por eso es selección única (radios) y se aplica al
 * instante — sin borrador ni botón "Aplicar".
 */
export function CatalogProveedorFilter({
  proveedores,
  isPending,
  isError,
  onRetry,
  seleccionado,
  onSeleccionar,
}: {
  proveedores: Proveedor[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  /** `supplierId` activo — null = todos los proveedores. */
  seleccionado: string | null
  onSeleccionar: (supplierId: string | null) => void
}) {
  return (
    <div className="flex max-h-[60vh] flex-col overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-ink)] lg:max-h-[calc(100vh-var(--catalogo-chrome-height)-2rem)]">
      {/* HEADER inmutable (el panel siempre está abierto). */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        <SlidersHorizontal
          className="size-4 shrink-0 text-[var(--color-on-ink-muted)]"
          aria-hidden="true"
        />
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-on-ink)]">
          Filtros
          {seleccionado ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-ink)] px-1.5 text-[10px] font-medium text-[var(--color-ink)]">
              1
            </span>
          ) : null}
        </span>
      </div>

      {/* CONTENIDO en blanco fijo, scrolleable. */}
      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--color-surface)]">
        <div className="h-full [scrollbar-gutter:stable] overflow-y-auto px-4 py-3">
          <p className="flex h-9 items-center gap-2 text-sm font-medium text-foreground">
            <Store
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            Proveedores
          </p>

          {isPending ? (
            <div className="flex animate-pulse flex-col gap-3 py-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-[var(--color-surface-subtle)]"
                  style={{ width: `${55 + ((i * 17) % 40)}%` }}
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-2 py-2">
              <p className="text-xs text-muted-foreground">
                No pudimos cargar los proveedores.
              </p>
              <JdhButton variant="secondary" size="sm" onClick={onRetry}>
                <RotateCcw aria-hidden="true" />
                Reintentar
              </JdhButton>
            </div>
          ) : (
            <fieldset className="flex flex-col gap-0.5 pt-1">
              <legend className="sr-only">Filtrar por proveedor</legend>
              <FilaProveedor
                label="Todos los proveedores"
                checked={seleccionado === null}
                onSelect={() => onSeleccionar(null)}
              />
              {(proveedores ?? []).map((proveedor) => (
                <FilaProveedor
                  key={proveedor.id}
                  label={proveedor.nombre}
                  checked={seleccionado === proveedor.id}
                  onSelect={() => onSeleccionar(proveedor.id)}
                />
              ))}
            </fieldset>
          )}
        </div>
      </div>

      {/* FOOTER inmutable. */}
      <div className="flex shrink-0 flex-col px-4 py-3">
        <JdhButton
          variant="ghost"
          size="sm"
          disabled={!seleccionado}
          className="h-9 w-full gap-1.5 text-[var(--color-on-ink)] hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)] disabled:text-[var(--color-on-ink-muted)]"
          onClick={() => onSeleccionar(null)}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Limpiar filtro
        </JdhButton>
      </div>
    </div>
  )
}

/** Fila de radio — claro fijo (no alterna con el tema), aplica al instante. */
function FilaProveedor({
  label,
  checked,
  onSelect,
}: {
  label: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 hover:bg-[var(--color-surface-subtle)]">
      <input
        type="radio"
        name="filtro-proveedor"
        checked={checked}
        onChange={onSelect}
        className="size-4 border-[var(--color-border-strong)] accent-[var(--color-ink)]"
      />
      <span
        className={cn(
          "flex-1 text-sm text-foreground",
          checked && "font-medium"
        )}
      >
        {label}
      </span>
    </label>
  )
}
