"use client"

import { useState } from "react"
import {
  ChevronDown,
  DollarSign,
  LayoutGrid,
  Package,
  Percent,
  RotateCcw,
  SlidersHorizontal,
  Tags,
  type LucideIcon,
} from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { filtrosIniciales, type FiltrosCatalogo } from "../types"

export interface FiltroOpcion {
  value: string
  label: string
  count: number
}

export interface CatalogFiltersProps {
  /** Filtros APLICADOS (los que muestra el grid — hoy solo visuales). */
  filtros: FiltrosCatalogo
  /** Recibe el set completo al presionar "Aplicar filtros" o "Limpiar". */
  onChange: (nuevos: FiltrosCatalogo) => void
  categorias: FiltroOpcion[]
  marcas: FiltroOpcion[]
  presentaciones: FiltroOpcion[]
  /** Ref al contenedor scrolleable (para el wheel-hijack del aside). */
  scrollRef?: React.Ref<HTMLDivElement>
}

function contarActivos(f: FiltrosCatalogo): number {
  return (
    f.categorias.length +
    f.marcas.length +
    f.presentaciones.length +
    (f.precioMin != null ? 1 : 0) +
    (f.precioMax != null ? 1 : 0) +
    (f.soloOfertas ? 1 : 0) +
    (f.soloDisponibles ? 1 : 0)
  )
}

/** Sección colapsable del panel — items en BLANCO FIJO (no alternan). */
function SeccionFiltro({
  icono: Icono,
  titulo,
  defaultAbierto = true,
  children,
}: {
  icono: LucideIcon
  titulo: string
  defaultAbierto?: boolean
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = useState(defaultAbierto)

  return (
    <div className="flex flex-col border-b border-[var(--color-border)] py-2 last:border-b-0">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex h-9 w-full items-center gap-2 text-sm font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icono
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="flex-1 text-left">{titulo}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-base)]",
            abierto && "rotate-180"
          )}
        />
      </button>
      {abierto ? <div className="pt-1">{children}</div> : null}
    </div>
  )
}

/** Fila de checkbox con contador — claro fijo (no alterna con el tema). */
function FilaCheckbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean
  onChange: () => void
  label: string
  count: number
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 hover:bg-[var(--color-surface-subtle)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded-sm border-[var(--color-border-strong)] accent-[var(--color-ink)]"
      />
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {count}
      </span>
    </label>
  )
}

/** Fila de checkbox simple (sin contador) — claro fijo. */
function FilaCheckboxSimple({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1.5 hover:bg-[var(--color-surface-subtle)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 rounded-sm border-[var(--color-border-strong)] accent-[var(--color-ink)]"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  )
}

/**
 * Panel de filtros del listado — TODO EN NEGRO FIJO (no alterna con el
 * tema): tres bloques continuos sin divisores, como un header / contenido /
 * footer inmutables:
 *
 * 1. HEADER: "Filtros" con icono y badge de activos (no es botón — el panel
 *    está siempre abierto).
 * 2. CONTENIDO scrolleable (únicamente esto scrollea; scrollbar casi al
 *    edge con `scrollbar-gutter: stable`).
 * 3. FOOTER: botones "Aplicar filtros" (primary-on-ink) y "Limpiar"
 *    (on-ink), lockeados al fondo.
 *
 * Todos los items internos usan tokens on-ink/ink-border/overlay-on-dark —
 * blancos sobre negro, sin alternar entre temas. Los filtros son SOLO
 * VISUALES (data mockeada): la selección queda en el borrador y "Aplicar"
 * solo la confirma.
 */
export function CatalogFilters({
  filtros,
  onChange,
  categorias,
  marcas,
  presentaciones,
  scrollRef,
}: CatalogFiltersProps) {
  const [draft, setDraft] = useState<FiltrosCatalogo>(filtros)
  const [verTodasMarcas, setVerTodasMarcas] = useState(false)

  // El parent solo cambia `filtros` al APLICAR o LIMPIAR: re-sincroniza el
  // borrador durante el render (patrón oficial de React, sin effect).
  const [prevFiltros, setPrevFiltros] = useState(filtros)
  if (filtros !== prevFiltros) {
    setPrevFiltros(filtros)
    setDraft(filtros)
  }

  const set = (cambios: Partial<FiltrosCatalogo>) =>
    setDraft((d) => ({ ...d, ...cambios }))

  const toggle = (lista: string[], value: string) =>
    lista.includes(value) ? lista.filter((v) => v !== value) : [...lista, value]

  const aplicar = () => onChange(draft)
  const limpiar = () => {
    setDraft(filtrosIniciales)
    onChange(filtrosIniciales)
  }

  const marcasVisibles = verTodasMarcas ? marcas : marcas.slice(0, 6)
  const activosDraft = contarActivos(draft)

  return (
    <div className="flex max-h-[60vh] flex-col overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-ink)] lg:max-h-[calc(100vh-var(--catalogo-chrome-height)-2rem)]">
      {/* HEADER inmutable (no es botón — el panel siempre está abierto). */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        <SlidersHorizontal
          className="size-4 shrink-0 text-[var(--color-on-ink-muted)]"
          aria-hidden="true"
        />
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-on-ink)]">
          Filtros
          {activosDraft > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-ink)] px-1.5 text-[10px] font-medium text-[var(--color-ink)]">
              {activosDraft}
            </span>
          ) : null}
        </span>
      </div>

      {/* CONTENIDO INTERNO EN BLANCO FIJO (no alterna con el tema): las
          secciones de Categorías a Presentación viven en un panel blanco
          SIN esquinas redondeadas — el redondeado inferior lo deja ver el
          contenedor negro de la raíz (overflow-hidden + rounded-md). */}
      <div className="min-h-0 flex-1 overflow-hidden bg-[var(--color-surface)]">
        <div
          ref={scrollRef}
          className="h-full [scrollbar-gutter:stable] overflow-y-auto px-4 py-2"
        >
          <SeccionFiltro icono={LayoutGrid} titulo="Categorías">
            <div className="flex flex-col gap-0.5">
              {categorias.map((categoria) => (
                <FilaCheckbox
                  key={categoria.value}
                  checked={draft.categorias.includes(categoria.value)}
                  onChange={() =>
                    set({
                      categorias: toggle(draft.categorias, categoria.value),
                    })
                  }
                  label={categoria.label}
                  count={categoria.count}
                />
              ))}
            </div>
          </SeccionFiltro>

          <SeccionFiltro icono={Tags} titulo="Marcas" defaultAbierto={false}>
            <div className="flex flex-col gap-0.5">
              {marcasVisibles.map((marca) => (
                <FilaCheckbox
                  key={marca.value}
                  checked={draft.marcas.includes(marca.value)}
                  onChange={() =>
                    set({ marcas: toggle(draft.marcas, marca.value) })
                  }
                  label={marca.label}
                  count={marca.count}
                />
              ))}
            </div>
            {marcas.length > 6 ? (
              <button
                type="button"
                onClick={() => setVerTodasMarcas((v) => !v)}
                className="inline-flex h-8 items-center gap-1 self-start text-sm font-medium text-[var(--color-on-ink)] underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:ring-2 focus-visible:ring-[var(--color-focus-on-ink)] focus-visible:outline-none"
              >
                {verTodasMarcas ? "Ver menos" : `Ver todas (${marcas.length})`}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-transform",
                    verTodasMarcas && "rotate-180"
                  )}
                />
              </button>
            ) : null}
          </SeccionFiltro>

          <SeccionFiltro
            icono={DollarSign}
            titulo="Rango de precios"
            defaultAbierto={false}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Mín"
                  value={draft.precioMin != null ? String(draft.precioMin) : ""}
                  onChange={(e) => {
                    const v = e.target.value
                    set({ precioMin: v === "" ? null : Number(v) })
                  }}
                  aria-label="Precio mínimo en pesos"
                  className="h-9"
                />
                <span className="text-muted-foreground" aria-hidden="true">
                  –
                </span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Máx"
                  value={draft.precioMax != null ? String(draft.precioMax) : ""}
                  onChange={(e) => {
                    const v = e.target.value
                    set({ precioMax: v === "" ? null : Number(v) })
                  }}
                  aria-label="Precio máximo en pesos"
                  className="h-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Valores en pesos COP. Se aplican con el botón Aplicar.
              </p>
            </div>
          </SeccionFiltro>

          <SeccionFiltro
            icono={Percent}
            titulo="Ofertas y disponibilidad"
            defaultAbierto={false}
          >
            <div className="flex flex-col">
              <FilaCheckboxSimple
                label="Solo ofertas"
                checked={draft.soloOfertas}
                onChange={() => set({ soloOfertas: !draft.soloOfertas })}
              />
              <FilaCheckboxSimple
                label="Solo disponibles"
                description="Oculta los productos agotados"
                checked={draft.soloDisponibles}
                onChange={() =>
                  set({ soloDisponibles: !draft.soloDisponibles })
                }
              />
            </div>
          </SeccionFiltro>

          <SeccionFiltro
            icono={Package}
            titulo="Presentación"
            defaultAbierto={false}
          >
            <div className="flex flex-col gap-0.5">
              {presentaciones.map((presentacion) => (
                <FilaCheckbox
                  key={presentacion.value}
                  checked={draft.presentaciones.includes(presentacion.value)}
                  onChange={() =>
                    set({
                      presentaciones: toggle(
                        draft.presentaciones,
                        presentacion.value
                      ),
                    })
                  }
                  label={presentacion.label}
                  count={presentacion.count}
                />
              ))}
            </div>
          </SeccionFiltro>
        </div>
      </div>

      {/* FOOTER inmutable: botones lockeados, sin divisor con el contenido. */}
      <div className="flex shrink-0 flex-col gap-2 px-4 py-3">
        <JdhButton
          variant="primary-on-ink"
          className="w-full"
          onClick={aplicar}
        >
          Aplicar filtros
        </JdhButton>
        <JdhButton
          variant="ghost"
          size="sm"
          className="h-9 w-full gap-1.5 text-[var(--color-on-ink)] hover:bg-[var(--overlay-on-dark-08)] hover:text-[var(--color-on-ink)]"
          onClick={limpiar}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Limpiar
        </JdhButton>
      </div>
    </div>
  )
}
