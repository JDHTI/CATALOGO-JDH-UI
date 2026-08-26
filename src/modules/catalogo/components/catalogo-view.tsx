"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Route } from "next"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PackageSearch, RotateCcw, Search, X } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { EmptyState } from "@/components/common/empty-state"
import { Pagination } from "@/components/navigation/pagination"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { Input } from "@/components/ui/input"
import { formatNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useMarcas, useProductos, useProveedores } from "../hooks/use-productos"
import { CatalogBannerCarousel } from "./catalog-banner-carousel"
import { CatalogFilters } from "./catalog-filters"
import { ProductoCard, ProductoCardSkeleton } from "./producto-card"

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400

/**
 * Fallback de Suspense para la ruta: `CatalogoView` usa `useSearchParams`,
 * así que el prerender estático de `/productos` sirve esto hasta hidratar.
 * Misma silueta que la carga inicial del grid para que no haya salto.
 */
export function CatalogoViewFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <ProductoCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Listado de productos REALES del API (jdh-catalogo-api) — referencia visual
 * sin venta ni precio. Búsqueda, los dos ejes de clasificación y la página
 * viven en la URL (`?q=&proveedor=&marca=&pagina=`): el estado es
 * compartible, el botón atrás funciona, y el buscador del header (que navega
 * a `/productos?q=…`) cae en el mismo mecanismo. La data llega vía TanStack
 * Query con `keepPreviousData` (grid atenuado mientras carga la página
 * siguiente, sin flash de skeleton).
 */
export function CatalogoView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const q = searchParams.get("q")?.trim() ?? ""
  const proveedorId = searchParams.get("proveedor")
  const marcaId = searchParams.get("marca")
  const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1)

  const actualizarParams = useCallback(
    (cambios: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === "") params.delete(clave)
        else params.set(clave, valor)
      }
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, {
        scroll: false,
      })
    },
    [router, pathname, searchParams]
  )

  // Input controlado + debounce hacia la URL. Se re-sincroniza durante el
  // render si `q` cambia desde fuera (buscador del header) — patrón oficial
  // de React, sin effect.
  const [busqueda, setBusqueda] = useState(q)
  const [prevQ, setPrevQ] = useState(q)
  if (q !== prevQ) {
    setPrevQ(q)
    setBusqueda(q)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda.trim() !== q) {
        actualizarParams({ q: busqueda.trim() || null, pagina: null })
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [busqueda, q, actualizarParams])

  const productos = useProductos({
    page: pagina,
    limit: PAGE_SIZE,
    search: q || undefined,
    supplierId: proveedorId ?? undefined,
    brandId: marcaId ?? undefined,
  })
  const proveedores = useProveedores()
  // Las marcas se acotan al proveedor elegido: con miles de productos, la
  // lista global de marcas no ayuda a refinar dentro de un proveedor.
  const marcas = useMarcas(proveedorId ? { supplierId: proveedorId } : {})

  const gridRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const filtrosScrollRef = useRef<HTMLDivElement>(null)

  const irAPagina = (target: number) => {
    actualizarParams({ pagina: target > 1 ? String(target) : null })
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const limpiarFiltros = () =>
    actualizarParams({ proveedor: null, marca: null, pagina: null })

  const limpiarTodo = () => {
    setBusqueda("")
    actualizarParams({ q: null, proveedor: null, marca: null, pagina: null })
  }

  /**
   * WHEEL-HIJACK del área de filtros (UX) — con listener NATIVO no-pasivo:
   * los eventos `wheel` de React son pasivos (preventDefault no bloquea la
   * página, y Lenis la scrollea igual). Aquí, si el cursor está a la
   * izquierda del borde derecho del aside (incluye el espacio hasta el borde
   * de pantalla) y el panel puede scrollear en esa dirección: preventDefault
   * + stopPropagation (Lenis no recibe el evento) + avance con multiplicador
   * (1.6×) para que se sienta más responsivo. Cuando el panel llega a su
   * límite, el evento fluye normal a la página. Solo en desktop (lg+).
   */
  useEffect(() => {
    const grid = gridRef.current
    const aside = asideRef.current
    const panel = filtrosScrollRef.current
    if (!grid || !aside || !panel) return

    const onWheel = (event: WheelEvent) => {
      if (window.innerWidth < 1024) return
      const rect = aside.getBoundingClientRect()
      // Cursor a la DERECHA del panel → scroll normal de la página.
      if (event.clientX > rect.right) return

      const { scrollTop, scrollHeight, clientHeight } = panel
      const puedeBajar = scrollHeight - scrollTop - clientHeight > 1
      const puedeSubir = scrollTop > 0
      // Normaliza líneas (Firefox) y multiplica para un avance más marcado.
      const dy =
        (event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY) * 1.6

      if (
        (event.deltaY > 0 && puedeBajar) ||
        (event.deltaY < 0 && puedeSubir)
      ) {
        event.preventDefault()
        event.stopPropagation()
        panel.scrollTop += dy
      }
    }

    // passive: false — imprescindible para que preventDefault funcione.
    grid.addEventListener("wheel", onWheel, { passive: false })
    return () => grid.removeEventListener("wheel", onWheel)
  }, [])

  const meta = productos.data?.meta
  const visibles = productos.data?.data ?? []
  const hayFiltrosActivos = Boolean(q || proveedorId || marcaId)
  const inicio = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0
  const fin = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: "Todos los productos" },
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Todos los productos
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Portafolio completo JDH para operaciones institucionales: consulta
          referencias por proveedor, marca o código de producto.
        </p>
      </header>

      {/* El panel de filtros arranca DESDE debajo de "Todos los productos". */}
      <div
        ref={gridRef}
        className="grid scroll-mt-[calc(var(--catalogo-chrome-height)+1rem)] grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]"
      >
        {/* Filtros: panel NEGRO fijo con scroll interno que responde a la
            rueda en toda la zona izquierda. */}
        <aside
          ref={asideRef}
          className="lg:sticky lg:top-[calc(var(--catalogo-chrome-height)+1rem)] lg:self-start"
        >
          <CatalogFilters
            proveedores={proveedores.data}
            proveedoresPending={proveedores.isPending}
            proveedoresError={proveedores.isError}
            onRetryProveedores={() => proveedores.refetch()}
            proveedorId={proveedorId}
            // Cambiar de proveedor invalida la marca elegida: puede no
            // existir en el proveedor nuevo.
            onProveedorChange={(id) =>
              actualizarParams({ proveedor: id, marca: null, pagina: null })
            }
            marcas={marcas.data}
            marcasPending={marcas.isPending}
            marcasError={marcas.isError}
            marcasNoImplementado={marcas.noImplementado}
            onRetryMarcas={() => marcas.refetch()}
            marcaId={marcaId}
            onMarcaChange={(id) =>
              actualizarParams({ marca: id, pagina: null })
            }
            onLimpiar={limpiarFiltros}
            scrollRef={filtrosScrollRef}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Banner de imágenes de producto, al tamaño de la lista. */}
          <CatalogBannerCarousel />

          {/* Barra de resultados: búsqueda + recuento. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre, código o marca…"
                aria-label="Buscar productos por nombre, código o marca"
                className="h-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {busqueda ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setBusqueda("")}
                  className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              {productos.isPending ? (
                "Cargando productos…"
              ) : meta ? (
                <>
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {formatNumero(inicio)}–{formatNumero(fin)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {formatNumero(meta.total)}
                  </span>{" "}
                  productos
                </>
              ) : null}
            </p>
          </div>

          {/* Grid de resultados: skeleton en la carga inicial, grid atenuado
              en las siguientes (keepPreviousData), vacío y error con salida. */}
          {productos.isPending ? (
            <div
              className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <ProductoCardSkeleton key={i} />
              ))}
            </div>
          ) : productos.isError ? (
            <EmptyState
              icon={PackageSearch}
              title="No pudimos cargar el catálogo"
              description="Hubo un problema consultando los productos. Verifica tu conexión e inténtalo de nuevo."
            >
              <JdhButton
                variant="secondary"
                size="sm"
                onClick={() => productos.refetch()}
              >
                <RotateCcw aria-hidden="true" />
                Reintentar
              </JdhButton>
            </EmptyState>
          ) : visibles.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Sin resultados"
              description={
                hayFiltrosActivos
                  ? "Ningún producto coincide con la búsqueda o los filtros seleccionados."
                  : "El catálogo está vacío en este momento."
              }
            >
              {hayFiltrosActivos ? (
                <JdhButton variant="secondary" size="sm" onClick={limpiarTodo}>
                  Limpiar búsqueda y filtros
                </JdhButton>
              ) : null}
            </EmptyState>
          ) : (
            <div
              aria-busy={productos.isPlaceholderData}
              className={cn(
                "transition-opacity duration-[var(--duration-base)]",
                productos.isPlaceholderData && "pointer-events-none opacity-50"
              )}
            >
              <Stagger
                staggerDelay={0.04}
                className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
              >
                {visibles.map((producto) => (
                  <StaggerItem key={producto.id} className="h-full">
                    <ProductoCard producto={producto} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}

          {meta ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={irAPagina}
              className="mt-2"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
