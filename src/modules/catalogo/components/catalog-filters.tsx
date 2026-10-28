"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import {
  Check,
  ChevronDown,
  Layers,
  LayoutGrid,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Store,
  Tags,
} from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { Input } from "@/components/ui/input"
import { useMontado } from "@/hooks/use-montado"
import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Categoria, Marca, Proveedor } from "../types"

/**
 * Selección ÚNICA por eje (AND entre categoría, subcategoría, proveedor y
 * marca). Fue múltiple (OR dentro del eje) y se revirtió: la búsqueda local
 * esconde los ya marcados, así que elegir "Colanta" tras "Alpina" sumaba
 * ambos sin que se viera, y los productos del primero parecían quedarse
 * pegados. Los props siguen siendo arrays porque la URL y el API aceptan
 * varios ids (enlaces viejos siguen funcionando); desde el panel solo se
 * escribe uno.
 */

const MAX_VISIBLES = 50

const CONSULTA_ESCRITORIO = "(min-width: 1024px)"

/**
 * ¿Estamos en un viewport de escritorio? Decide si el panel nace abierto.
 *
 * Va por `useSyncExternalStore` y no por un `useEffect`: el snapshot del
 * servidor es `false` (asume móvil, el caso más restrictivo), así que el
 * HTML llega con el panel cerrado y React lo abre al hidratar si hay ancho.
 * Es el mecanismo que React ofrece para leer una fuente externa como
 * `matchMedia` sin romper la hidratación, y además reacciona al redimensionar.
 */
function useEsEscritorio(): boolean {
  return useSyncExternalStore(
    (alCambiar) => {
      const consulta = window.matchMedia(CONSULTA_ESCRITORIO)
      consulta.addEventListener("change", alCambiar)
      return () => consulta.removeEventListener("change", alCambiar)
    },
    () => window.matchMedia(CONSULTA_ESCRITORIO).matches,
    () => false
  )
}

export interface CatalogFiltersProps {
  /**
   * Árbol de `GET /categories` con los conteos ya acotados a proveedor/marca.
   * Si la consulta falla, no hay datos o el API aún no la publica, la sección
   * se OCULTA: el resto del panel (y el catálogo) sigue funcionando.
   */
  categorias?: Categoria[]
  categoriasPending?: boolean
  /** Categoría activa; vacío = todas. */
  categoriaIds?: string[]
  onCategoriaChange?: (categoryId: string[]) => void
  /** Subcategoría activa; vacío = todas las de la categoría. */
  subcategoriaIds?: string[]
  onSubcategoriaChange?: (subcategoryId: string[]) => void

  proveedores: Proveedor[] | undefined
  proveedoresPending: boolean
  proveedoresError: boolean
  onRetryProveedores: () => void
  /** Proveedores activos; vacío = todos. */
  proveedorIds: string[]
  onProveedorChange: (supplierId: string[]) => void

  marcas: Marca[] | undefined
  marcasPending: boolean
  marcasError: boolean
  /** El backend todavía no publica `/brands`: se oculta el eje marca. */
  marcasNoImplementado: boolean
  onRetryMarcas: () => void
  /** Marcas activas; vacío = todas. */
  marcaIds: string[]
  onMarcaChange: (brandId: string[]) => void

  onLimpiar: () => void
  /** Ref al contenedor scrolleable (para el wheel-hijack del aside). */
  scrollRef?: React.Ref<HTMLDivElement>
}

export function CatalogFilters({
  categorias,
  categoriasPending = false,
  categoriaIds = [],
  onCategoriaChange = () => {},
  subcategoriaIds = [],
  onSubcategoriaChange = () => {},
  proveedores,
  proveedoresPending,
  proveedoresError,
  onRetryProveedores,
  proveedorIds,
  onProveedorChange,
  marcas,
  marcasPending,
  marcasError,
  marcasNoImplementado,
  onRetryMarcas,
  marcaIds,
  onMarcaChange,
  onLimpiar,
  scrollRef,
}: CatalogFiltersProps) {
  // El estado real de los ejes se difiere hasta después de montar. Sin eso,
  // `next dev` lanza un error de hidratación: la vista vive dentro del
  // `<Suspense>` que exige `useSearchParams` y React hidrata ese subárbol
  // DESPUÉS del layout, cuando `MainNav` —que comparte la query de marcas—
  // ya la resolvió; el cliente pintaba "Sin datos" donde el HTML del
  // servidor tenía el esqueleto.
  const montado = useMontado()
  const esEscritorio = useEsEscritorio()
  // `null` = nadie ha tocado el disclosure, así que manda el viewport.
  const [forzado, setForzado] = useState<boolean | null>(null)
  const abierto = forzado ?? esEscritorio
  const activos =
    categoriaIds.length +
    subcategoriaIds.length +
    proveedorIds.length +
    marcaIds.length

  // Las subcategorías son las de la categoría elegida. Una subcategoría que
  // llega sola por la URL aporta también a su categoría padre, para que el
  // panel muestre la jerarquía completa.
  const padres = useMemo(
    () =>
      (categorias ?? []).filter(
        (categoria) =>
          categoriaIds.includes(categoria.id) ||
          categoria.subcategorias.some((sub) =>
            subcategoriaIds.includes(sub.id)
          )
      ),
    [categorias, categoriaIds, subcategoriaIds]
  )
  const subcategorias = useMemo(
    () => padres.flatMap((padre) => padre.subcategorias),
    [padres]
  )
  // Con datos previos (refetch fallido) la sección se queda; sin datos, no
  // hay nada útil que mostrar ni que reintentar.
  const hayCategorias = (categorias?.length ?? 0) > 0
  const ocultarCategorias = montado && !categoriasPending && !hayCategorias

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-ink)]",
        // La altura solo se limita cuando hay algo desplegado; cerrado, el
        // panel es una barra y no debe reservar 60vh de nada.
        // En `lg` manda `--filtros-alto`, que `CatalogoView` mide en vivo
        // contra el borde real del aside; el `calc` es solo el valor previo a
        // la primera medición.
        abierto &&
          "max-h-[70dvh] lg:max-h-[var(--filtros-alto,calc(100dvh-var(--catalogo-chrome-height)-2rem))]"
      )}
    >
      {/* ENCABEZADO = disparador del disclosure. */}
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="panel-filtros"
        onClick={() => setForzado(!abierto)}
        className="flex h-12 w-full shrink-0 items-center gap-2 px-4 text-left transition-colors hover:bg-[var(--overlay-on-dark-08)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-on-ink)] focus-visible:-outline-offset-2 focus-visible:outline-none"
      >
        <SlidersHorizontal
          className="size-4 shrink-0 text-[var(--color-on-ink-muted)]"
          aria-hidden="true"
        />
        <span className="inline-flex flex-1 items-center gap-2 text-sm font-medium text-[var(--color-on-ink)]">
          Filtros
          {activos > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-ink)] px-1.5 text-[10px] font-medium text-[var(--color-ink)]">
              {activos}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-[var(--color-on-ink-muted)] transition-transform duration-[var(--duration-base)]",
            abierto && "rotate-180"
          )}
        />
      </button>

      {/* CONTENIDO en blanco fijo, scrolleable. */}
      <div
        id="panel-filtros"
        className={cn(
          "flex min-h-0 flex-col overflow-hidden bg-[var(--color-surface)]",
          // Clase de Tailwind y no el atributo `hidden`: cualquier `display`
          // explícito del elemento ganaría sobre `[hidden] { display: none }`.
          !abierto && "hidden"
        )}
      >
        <div
          ref={scrollRef}
          data-lenis-prevent
          // `contain: content` NO es decorativo: aísla este subárbol del
          // layout de la página. Sin él, la lista interna (~4.700 px con los
          // dos ejes desplegados) se filtraba al `scrollHeight` del documento
          // pese al `overflow`, y `/productos` dejaba bajar casi una pantalla
          // entera por debajo del paginador, ya en blanco — el scroll de la
          // página no terminaba donde termina la lista de productos.
          className="min-h-0 [scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-2 pb-5 [contain:content]"
        >
          {/* Categorías primero: es el eje con el que se navega el catálogo.
              Como el de marcas, se decide en cliente (el 404 y los errores
              solo se conocen ahí), así que antes de montar se pinta el
              esqueleto para no cambiar la estructura respecto al SSR. */}
          {ocultarCategorias ? null : (
            <EjeFiltro
              icono={LayoutGrid}
              titulo="Categorías"
              etiquetaTodos="Todas las categorías"
              placeholderBusqueda="Buscar categoría…"
              items={categorias}
              isPending={!montado || categoriasPending}
              isError={false}
              onRetry={() => {}}
              seleccionado={categoriaIds}
              onSeleccionar={onCategoriaChange}
              // Los conteos ya vienen acotados al proveedor/marca activos.
              nota={
                proveedorIds.length + marcaIds.length > 0
                  ? "Conteos según proveedor y marca seleccionados."
                  : undefined
              }
            />
          )}

          {/* `key` por padre: al cambiar de categoría la búsqueda local de
              subcategorías no debe arrastrar el término anterior. */}
          {subcategorias.length > 0 ? (
            <EjeFiltro
              key={padres.map((padre) => padre.id).join(",")}
              icono={Layers}
              titulo="Subcategorías"
              etiquetaTodos="Todas las subcategorías"
              placeholderBusqueda="Buscar subcategoría…"
              items={subcategorias}
              isPending={false}
              isError={false}
              onRetry={() => {}}
              seleccionado={subcategoriaIds}
              onSeleccionar={onSubcategoriaChange}
              nota={
                padres.length === 1
                  ? `Dentro de ${formatNombreComercial(padres[0].nombre)}.`
                  : undefined
              }
            />
          ) : null}

          <EjeFiltro
            icono={Store}
            titulo="Proveedores"
            etiquetaTodos="Todos los proveedores"
            placeholderBusqueda="Buscar proveedor…"
            items={proveedores}
            isPending={!montado || proveedoresPending}
            isError={montado && proveedoresError}
            onRetry={onRetryProveedores}
            seleccionado={proveedorIds}
            onSeleccionar={onProveedorChange}
          />

          {/* El 404 de `/brands` solo se conoce en cliente: ocultar el eje
              antes de montar cambiaría la estructura respecto al SSR. */}
          {montado && marcasNoImplementado ? null : (
            <EjeFiltro
              icono={Tags}
              titulo="Marcas"
              etiquetaTodos="Todas las marcas"
              placeholderBusqueda="Buscar marca…"
              items={marcas}
              isPending={!montado || marcasPending}
              isError={montado && marcasError}
              onRetry={onRetryMarcas}
              seleccionado={marcaIds}
              onSeleccionar={onMarcaChange}
              // Con proveedor elegido, el API acota tanto la lista como el
              // conteo de cada marca; el copy lo dice para que el número no
              // se lea como el total del catálogo.
              nota={
                proveedorIds.length > 0
                  ? "Marcas y conteos del proveedor seleccionado."
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* PIE: se va con el contenido cuando el panel está cerrado. */}
      <div
        className={cn(
          "shrink-0 flex-col px-4 py-3",
          abierto ? "flex" : "hidden"
        )}
      >
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
 * Un eje de clasificación: título, búsqueda local y lista de opciones. La
 * búsqueda filtra en cliente sobre la lista completa (el API la devuelve
 * entera, sin paginar) y solo se pintan `MAX_VISIBLES` resultados; el resto
 * se alcanza refinando el término, que es más rápido que un scroll de
 * cientos de filas.
 */
function EjeFiltro({
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
  icono: typeof Store
  titulo: string
  etiquetaTodos: string
  placeholderBusqueda: string
  items: ItemEje[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  seleccionado: string[]
  onSeleccionar: (id: string[]) => void
  nota?: string
}) {
  const [filtro, setFiltro] = useState("")
  const [desplegado, setDesplegado] = useState(true)

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
      {/* Cada eje se pliega por su cuenta: con dos listas largas, poder
          cerrar una para ver la otra entera es la diferencia entre buscar y
          rebuscar. */}
      <button
        type="button"
        aria-expanded={desplegado}
        onClick={() => setDesplegado((v) => !v)}
        className="flex h-9 w-full items-center gap-2 text-left text-sm font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Icono
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="flex-1 truncate">{titulo}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-base)]",
            desplegado && "rotate-180"
          )}
        />
      </button>

      {!desplegado ? null : isPending ? (
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
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
                placeholder={placeholderBusqueda}
                aria-label={`Buscar dentro de ${titulo.toLowerCase()}`}
                // `pl-10` deja aire entre el icono y el texto: con `pl-8` el
                // placeholder arrancaba pegado al icono.
                className="h-9 w-full pl-10 text-sm [&::-webkit-search-cancel-button]:appearance-none"
              />
            </div>
          ) : null}

          {/* `min-w-0` en el fieldset NO es decorativo: el navegador le
              aplica `min-inline-size: min-content`, así que crecía hasta el
              nombre de proveedor más largo, ignoraba el ancho del panel y
              provocaba el scroll horizontal. Con el ancho ya limitado, el
              `truncate` de cada fila por fin recorta. */}
          <fieldset className="flex min-w-0 flex-col gap-0.5">
            <legend className="sr-only">Filtrar por {titulo}</legend>
            {/* "Todos" solo tiene sentido sin búsqueda activa. */}
            {filtro.trim() === "" ? (
              <FilaEje
                label={etiquetaTodos}
                checked={seleccionado.length === 0}
                onSelect={() => onSeleccionar([])}
              />
            ) : null}

            {visibles.map((item) => (
              <FilaEje
                key={item.id}
                // Se muestra formateado, pero la búsqueda de arriba corre
                // sobre el nombre crudo del ERP, que es el dato real.
                label={formatNombreComercial(item.nombre)}
                count={item.totalProductos}
                checked={seleccionado.includes(item.id)}
                // Reemplaza la selección; pulsar el activo lo quita.
                onSelect={() =>
                  onSeleccionar(
                    seleccionado.length === 1 && seleccionado[0] === item.id
                      ? []
                      : [item.id]
                  )
                }
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

/** Una fila del eje: opción de selección única. */
function FilaEje({
  label,
  count,
  checked,
  onSelect,
}: {
  label: string
  count?: number
  checked: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        checked && "bg-[var(--color-surface-subtle)]"
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 text-sm break-words text-foreground",
          checked && "font-medium"
        )}
      >
        {label}
      </span>
      {count != null ? (
        <span className="shrink-0 text-xs text-[var(--color-text-secondary)] tabular-nums">
          {count}
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)]",
          checked && "border-foreground bg-foreground text-background"
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  )
}
