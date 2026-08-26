"use client"

import { useMemo, useState } from "react"
import { RotateCcw, Search, SlidersHorizontal, Store, Tags } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { Input } from "@/components/ui/input"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Marca, Proveedor } from "../types"

/**
 * Panel de filtros del catálogo. Dos ejes, los únicos que existen en los
 * datos reales: PROVEEDOR y MARCA (las categorías del esquema aún no tienen
 * datos). Ambos son selección única porque el API acepta un `supplierId` y
 * un `brandId`, y se aplican al instante — sin borrador ni botón "Aplicar".
 *
 * Diseñado para la escala real (cientos de proveedores): cada eje tiene
 * búsqueda local sobre la lista completa que ya trajo el API y solo pinta
 * los primeros `MAX_VISIBLES` resultados, para no meter cientos de nodos en
 * el DOM. Las marcas se acotan al proveedor seleccionado.
 *
 * Mantiene el lenguaje visual del panel original: bloque NEGRO fijo con el
 * contenido en blanco fijo (no alterna con el tema), header y footer
 * inmutables y scroll solo en el centro.
 */

const MAX_VISIBLES = 50

export interface CatalogFiltersProps {
  proveedores: Proveedor[] | undefined
  proveedoresPending: boolean
  proveedoresError: boolean
  onRetryProveedores: () => void
  /** `supplierId` activo — null = todos. */
  proveedorId: string | null
  onProveedorChange: (supplierId: string | null) => void

  marcas: Marca[] | undefined
  marcasPending: boolean
  marcasError: boolean
  /** El backend todavía no publica `/brands`: se oculta el eje marca. */
  marcasNoImplementado: boolean
  onRetryMarcas: () => void
  /** `brandId` activo — null = todas. */
  marcaId: string | null
  onMarcaChange: (brandId: string | null) => void

  onLimpiar: () => void
  /** Ref al contenedor scrolleable (para el wheel-hijack del aside). */
  scrollRef?: React.Ref<HTMLDivElement>
}

export function CatalogFilters({
  proveedores,
  proveedoresPending,
  proveedoresError,
  onRetryProveedores,
  proveedorId,
  onProveedorChange,
  marcas,
  marcasPending,
  marcasError,
  marcasNoImplementado,
  onRetryMarcas,
  marcaId,
  onMarcaChange,
  onLimpiar,
  scrollRef,
}: CatalogFiltersProps) {
  const activos = (proveedorId ? 1 : 0) + (marcaId ? 1 : 0)

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
          {activos > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-ink)] px-1.5 text-[10px] font-medium text-[var(--color-ink)]">
              {activos}
            </span>
          ) : null}
        </span>
      </div>

      {/* CONTENIDO en blanco fijo, scrolleable. */}
      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--color-surface)]">
        <div
          ref={scrollRef}
          className="h-full [scrollbar-gutter:stable] overflow-y-auto px-4 py-2"
        >
          <EjeFiltro
            grupo="proveedor"
            icono={Store}
            titulo="Proveedores"
            etiquetaTodos="Todos los proveedores"
            placeholderBusqueda="Buscar proveedor…"
            items={proveedores}
            isPending={proveedoresPending}
            isError={proveedoresError}
            onRetry={onRetryProveedores}
            seleccionado={proveedorId}
            onSeleccionar={onProveedorChange}
          />

          {marcasNoImplementado ? null : (
            <EjeFiltro
              grupo="marca"
              icono={Tags}
              titulo="Marcas"
              etiquetaTodos="Todas las marcas"
              placeholderBusqueda="Buscar marca…"
              items={marcas}
              isPending={marcasPending}
              isError={marcasError}
              onRetry={onRetryMarcas}
              seleccionado={marcaId}
              onSeleccionar={onMarcaChange}
              // Con proveedor elegido, el API acota tanto la lista como el
              // conteo de cada marca; el copy lo dice para que el número no
              // se lea como el total del catálogo.
              nota={
                proveedorId
                  ? "Marcas y conteos del proveedor seleccionado."
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* FOOTER inmutable. */}
      <div className="flex shrink-0 flex-col px-4 py-3">
        <JdhButton
          variant="ghost"
          size="sm"
          disabled={activos === 0}
          className="h-9 w-full gap-1.5 text-[var(--color-on-ink)] hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)] disabled:text-[var(--color-on-ink-muted)]"
          onClick={onLimpiar}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Limpiar filtros
        </JdhButton>
      </div>
    </div>
  )
}

/** Item mínimo que comparten los dos ejes. */
interface ItemEje {
  id: string
  nombre: string
  totalProductos?: number
}

/**
 * Un eje de clasificación: título, búsqueda local y lista de radios. La
 * búsqueda filtra en cliente sobre la lista completa (el API la devuelve
 * entera, sin paginar) y solo se pintan `MAX_VISIBLES` resultados; el resto
 * se alcanza refinando el término, que es más rápido que un scroll de
 * cientos de filas.
 */
function EjeFiltro({
  grupo,
  icono: Icono,
  titulo,
  etiquetaTodos,
  placeholderBusqueda,
  items,
  isPending,
  isError,
  onRetry,
  seleccionado,
  onSeleccionar,
  nota,
}: {
  grupo: string
  icono: typeof Store
  titulo: string
  etiquetaTodos: string
  placeholderBusqueda: string
  items: ItemEje[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  seleccionado: string | null
  onSeleccionar: (id: string | null) => void
  nota?: string
}) {
  const [filtro, setFiltro] = useState("")

  const { visibles, ocultos, hayItems } = useMemo(() => {
    const lista = items ?? []
    const termino = filtro.trim().toLowerCase()
    const coincidencias = termino
      ? lista.filter((item) => item.nombre.toLowerCase().includes(termino))
      : lista
    return {
      visibles: coincidencias.slice(0, MAX_VISIBLES),
      ocultos: Math.max(0, coincidencias.length - MAX_VISIBLES),
      hayItems: lista.length > 0,
    }
  }, [items, filtro])

  return (
    <div className="flex flex-col border-b border-[var(--color-border)] py-2 last:border-b-0">
      <p className="flex h-9 items-center gap-2 text-sm font-medium text-foreground">
        <Icono
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {titulo}
      </p>

      {isPending ? (
        <div className="flex animate-pulse flex-col gap-3 py-2" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
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
            No pudimos cargar este filtro.
          </p>
          <JdhButton variant="secondary" size="sm" onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Reintentar
          </JdhButton>
        </div>
      ) : !hayItems ? (
        <p className="py-2 text-xs text-muted-foreground">
          Sin datos disponibles todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          {nota ? (
            <p className="text-xs text-muted-foreground">{nota}</p>
          ) : null}

          {/* La búsqueda local solo aparece cuando la lista es larga. */}
          {(items ?? []).length > 12 ? (
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
                placeholder={placeholderBusqueda}
                aria-label={`Buscar dentro de ${titulo.toLowerCase()}`}
                className="h-9 pl-8 text-sm [&::-webkit-search-cancel-button]:appearance-none"
              />
            </div>
          ) : null}

          <fieldset className="flex flex-col gap-0.5">
            <legend className="sr-only">Filtrar por {titulo}</legend>
            {/* "Todos" solo tiene sentido sin búsqueda activa. */}
            {filtro.trim() === "" ? (
              <FilaEje
                grupo={grupo}
                label={etiquetaTodos}
                checked={seleccionado === null}
                onSelect={() => onSeleccionar(null)}
              />
            ) : null}

            {visibles.map((item) => (
              <FilaEje
                key={item.id}
                grupo={grupo}
                // Se muestra formateado, pero la búsqueda de arriba corre
                // sobre el nombre crudo del ERP, que es el dato real.
                label={formatNombreComercial(item.nombre)}
                count={item.totalProductos}
                checked={seleccionado === item.id}
                onSelect={() => onSeleccionar(item.id)}
              />
            ))}
          </fieldset>

          {visibles.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Ningún resultado para “{filtro.trim()}”.
            </p>
          ) : null}

          {ocultos > 0 ? (
            <p className="text-xs text-muted-foreground">
              {ocultos} más — refina la búsqueda para verlos.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Fila de radio — claro fijo (no alterna con el tema), aplica al instante. */
function FilaEje({
  grupo,
  label,
  count,
  checked,
  onSelect,
}: {
  grupo: string
  label: string
  /** `totalProductos` del API — sin conteo en la fila "Todos". */
  count?: number
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 hover:bg-[var(--color-surface-subtle)]">
      <input
        type="radio"
        name={`filtro-${grupo}`}
        checked={checked}
        onChange={onSelect}
        className="size-4 shrink-0 border-[var(--color-border-strong)] accent-[var(--color-ink)]"
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-foreground",
          checked && "font-medium"
        )}
      >
        {label}
      </span>
      {count != null ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </label>
  )
}
