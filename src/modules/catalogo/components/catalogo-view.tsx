"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Route } from "next"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PackageSearch, RotateCcw } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { EmptyState } from "@/components/common/empty-state"
import { Pagination } from "@/components/navigation/pagination"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNombreComercial, formatNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import {
  useCategorias,
  useMarcas,
  useProductos,
  useProveedores,
} from "../hooks/use-productos"
import type { Marca } from "../types"
import { CatalogBannerCarousel } from "./catalog-banner-carousel"
import { CatalogFilters } from "./catalog-filters"
import { ProductoCard, ProductoCardSkeleton } from "./producto-card"
import { DestacadosCatalogo } from "./productos-vitrina"

const PAGE_SIZE = 12

/**
 * Fallback de Suspense para la ruta: `CatalogoView` usa `useSearchParams`,
 * así que el prerender estático de `/productos` sirve esto hasta hidratar.
 * Misma silueta que la carga inicial del grid para que no haya salto.
 */
export function CatalogoViewFallback() {
  return (
    <div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Cargando productos"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <ProductoCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Listado de productos REALES del API (jdh-catalogo-api) — referencia visual
 * sin venta ni precio. Búsqueda, los ejes de clasificación y la página viven
 * en la URL (`?q=&categoria=&subcategoria=&proveedor=&marca=&pagina=`): el
 * estado es
 * compartible y el botón atrás funciona. La data llega vía TanStack Query
 * con `keepPreviousData` (grid atenuado mientras carga la página siguiente,
 * sin flash de skeleton).
 *
 * Esta vista NO tiene campo de búsqueda: el término lo escribe el buscador
 * del header (`ProductSearchBar`) en `?q=`, y aquí solo se lee. Tener dos
 * buscadores a la vez obligaba a adivinar cuál manda.
 *
 * Con `marca`, la vista es la página de esa marca (`/marcas/[slug]`): la
 * marca la fija la ruta, no la URL, y `?proveedor=` / `?marca=` se ignoran.
 * El panel de filtros sigue igual, pero elegir otra opción NAVEGA en vez de
 * filtrar aquí: otra marca lleva a su página, y un proveedor o "Todas las
 * marcas" llevan a `/productos`. Es la misma regla que en el listado, donde
 * cambiar de proveedor descarta la marca. Categoría y subcategoría, en
 * cambio, sí filtran en el sitio: refinan la marca, no la reemplazan.
 */
export function CatalogoView({ marca }: { marca?: Marca } = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Un param de la URL puede repetirse o venir en CSV (`marca=3&marca=4`,
  // `marca=3,4`): ambas formas llegan aquí como una lista sin duplicados.
  const leerIds = (clave: string) => [
    ...new Set(
      searchParams
        .getAll(clave)
        .flatMap((v) => v.split(","))
        .filter(Boolean)
    ),
  ]

  const q = searchParams.get("q")?.trim() ?? ""
  const proveedorIds = marca ? [] : leerIds("proveedor")
  const marcaIds = marca ? [marca.id] : leerIds("marca")
  const categoriaIds = leerIds("categoria")
  const subcategoriaIds = leerIds("subcategoria")
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

  const productos = useProductos({
    page: pagina,
    limit: PAGE_SIZE,
    search: q || undefined,
    supplierIds: proveedorIds.length ? proveedorIds : undefined,
    brandIds: marcaIds.length ? marcaIds : undefined,
    categoryIds: categoriaIds.length ? categoriaIds : undefined,
    subcategoryIds: subcategoriaIds.length ? subcategoriaIds : undefined,
    // Los productos con foto van primero (ver `ProductosQueryParams.orderBy`).
    // Tiene que resolverlo el backend: la paginación es del lado del servidor.
    orderBy: "conImagen",
  })
  const proveedores = useProveedores()
  // Las marcas se acotan al proveedor elegido: con miles de productos, la
  // lista global de marcas no ayuda a refinar dentro de un proveedor.
  const marcas = useMarcas(
    proveedorIds.length ? { supplierIds: proveedorIds } : {}
  )
  // Los conteos de categorías reflejan los OTROS filtros activos (proveedor y
  // marca), no el árbol global: así el número de la fila es lo que el usuario
  // vería al elegirla. La búsqueda `q` no entra — `/categories` no la acepta.
  const categorias = useCategorias({
    ...(proveedorIds.length > 0 && { supplierIds: proveedorIds }),
    ...(marcaIds.length > 0 && { brandIds: marcaIds }),
  })

  const gridRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const filtrosScrollRef = useRef<HTMLDivElement>(null)

  const irAPagina = (target: number) => {
    actualizarParams({ pagina: target > 1 ? String(target) : null })
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // `push`, no `replace`: salir de la página de marca es cambiar de página, y
  // el botón atrás debe poder volver a ella.
  const salirAProductos = (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString()
    router.push(`/productos${query ? `?${query}` : ""}` as Route)
  }

  const cambiarProveedor = (id: string[]) => {
    if (marca) {
      salirAProductos(id.length ? { proveedor: id.join(",") } : {})
      return
    }
    // Cambiar de proveedor invalida la marca elegida: puede no existir en el
    // proveedor nuevo.
    actualizarParams({ proveedor: id.join(","), marca: null, pagina: null })
  }

  const cambiarMarca = (id: string[]) => {
    if (!marca) {
      actualizarParams({ marca: id.join(","), pagina: null })
      return
    }
    const destino = marcas.data?.find((m) => m.id === id[0])
    if (destino?.slug) router.push(`/marcas/${destino.slug}` as Route)
    else salirAProductos(id.length ? { marca: id.join(",") } : {})
  }

  // Cambiar de categoría invalida la subcategoría: una que no pertenece a la
  // categoría elegida deja el listado en 0 resultados, así que ese estado se
  // evita en origen en vez de explicarlo después.
  const cambiarCategoria = (id: string[]) =>
    actualizarParams({
      categoria: id.join(","),
      subcategoria: null,
      pagina: null,
    })

  const cambiarSubcategoria = (id: string[]) =>
    actualizarParams({ subcategoria: id.join(","), pagina: null })

  const limpiarFiltros = () =>
    marca
      ? salirAProductos()
      : actualizarParams({
          categoria: null,
          subcategoria: null,
          proveedor: null,
          marca: null,
          pagina: null,
        })

  const limpiarTodo = () =>
    marca
      ? salirAProductos()
      : actualizarParams({
          q: null,
          categoria: null,
          subcategoria: null,
          proveedor: null,
          marca: null,
          pagina: null,
        })

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

  /**
   * ALTO DEL PANEL DE FILTROS = lo que queda de PANTALLA bajo su borde
   * superior (lg+). Un `max-h` fijo de "viewport menos chrome" solo es
   * correcto cuando el aside ya está pegado; antes de eso arranca más abajo
   * (breadcrumb de por medio), su pie con "Limpiar filtros" caía bajo el
   * borde de la pantalla y solo aparecía al scrollear la página. Medir el
   * borde real en cada scroll deja el panel entero —encabezado, lista y
   * pie— siempre dentro del viewport; lo que no cabe se scrollea DENTRO.
   *
   * Se toma el mayor entre el borde real y el `top` del sticky: al final de
   * la página el grid empuja el aside hacia arriba, y sin ese tope el panel
   * crecería justo cuando ya no tiene sitio.
   */
  useEffect(() => {
    const aside = asideRef.current
    if (!aside) return

    const MARGEN_INFERIOR = 16
    const ALTO_MINIMO = 240
    let frame = 0

    const medir = () => {
      frame = 0
      if (window.innerWidth < 1024) {
        aside.style.removeProperty("--filtros-alto")
        return
      }
      const topSticky = parseFloat(getComputedStyle(aside).top) || 0
      const borde = Math.max(aside.getBoundingClientRect().top, topSticky)
      const alto = Math.max(
        ALTO_MINIMO,
        window.innerHeight - borde - MARGEN_INFERIOR
      )
      aside.style.setProperty("--filtros-alto", `${Math.round(alto)}px`)
    }
    const programar = () => {
      if (!frame) frame = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener("scroll", programar, { passive: true })
    window.addEventListener("resize", programar)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", programar)
      window.removeEventListener("resize", programar)
    }
  }, [])

  const meta = productos.data?.meta
  const visibles = productos.data?.data ?? []
  const hayFiltrosActivos = Boolean(
    q ||
    proveedorIds.length ||
    marcaIds.length ||
    categoriaIds.length ||
    subcategoriaIds.length
  )
  const inicio = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0
  const fin = meta ? Math.min(meta.page * meta.limit, meta.total) : 0
  const titulo = marca
    ? formatNombreComercial(marca.nombre)
    : "Todos los productos"

  return (
    <div className="flex flex-col gap-6">
      {/* El breadcrumb hace de encabezado visible: su último tramo ya dice
          "Todos los productos". El `h1` queda solo para lectores de pantalla
          — sin él la página no tendría título en el árbol de encabezados —
          y no ocupa alto, así filtros y productos quedan más arriba. */}
      <Breadcrumbs
        prominent
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: titulo },
        ]}
      />
      <h1 className="sr-only">{titulo}</h1>

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
            categorias={categorias.data}
            categoriasPending={categorias.isPending}
            categoriaIds={categoriaIds}
            onCategoriaChange={cambiarCategoria}
            subcategoriaIds={subcategoriaIds}
            onSubcategoriaChange={cambiarSubcategoria}
            proveedores={proveedores.data}
            proveedoresPending={proveedores.isPending}
            proveedoresError={proveedores.isError}
            onRetryProveedores={() => proveedores.refetch()}
            proveedorIds={proveedorIds}
            onProveedorChange={cambiarProveedor}
            marcas={marcas.data}
            marcasPending={marcas.isPending}
            marcasError={marcas.isError}
            marcasNoImplementado={marcas.noImplementado}
            onRetryMarcas={() => marcas.refetch()}
            marcaIds={marcaIds}
            onMarcaChange={cambiarMarca}
            onLimpiar={limpiarFiltros}
            scrollRef={filtrosScrollRef}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Banner de imágenes de producto, al tamaño de la lista. */}
          <CatalogBannerCarousel />

          {/* Barra de resultados. Aquí NO hay campo de búsqueda: el único
              buscador de la app es el del header, que escribe `?q=` en esta
              misma URL. Dos cajas de búsqueda en pantalla obligaban a
              adivinar cuál manda. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Con 0 resultados no se anuncia el rango: lo dice el estado
                vacío de abajo, y "Mostrando 0–0 de 0" es puro ruido. */}
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {productos.isPending ? (
                "Cargando productos…"
              ) : meta && meta.total > 0 ? (
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

          {meta && !productos.isError && visibles.length > 0 ? (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={irAPagina}
              className="mt-2"
            />
          ) : null}
        </div>
      </div>

      {/* Fuera del grid a propósito: a ancho completo, y así el aside
          sticky deja de acompañar al llegar aquí — su recorrido termina con
          la lista de productos. */}
      <DestacadosCatalogo className="mt-6 border-t border-[var(--color-border)] pt-10" />
    </div>
  )
}
