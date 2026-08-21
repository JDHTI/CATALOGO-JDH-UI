"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { PackageSearch } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  ProductCard,
  type ProductCardData,
} from "@/components/cards/product-card"
import { JdhButton } from "@/components/common/jdh-button"
import { EmptyState } from "@/components/common/empty-state"
import { Pagination } from "@/components/navigation/pagination"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { formatNumero } from "@/lib/format"

import { productosCatalogo } from "../mock/catalogo.mock"
import {
  filtrosIniciales,
  type FiltrosCatalogo,
  type OrdenCatalogo,
} from "../types"
import { CatalogBannerCarousel } from "./catalog-banner-carousel"
import { CatalogFilters, type FiltroOpcion } from "./catalog-filters"
import { OrdenDropdown } from "./orden-dropdown"

const PAGE_SIZE = 12

/** Producto del catálogo → datos de la card compartida. El listado va SIN
 *  foto en la card y SIN modal (el modal solo aplica en la homepage). */
function aCardData(p: (typeof productosCatalogo)[number]): ProductCardData {
  return {
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    marca: p.marca,
    precioCentavos: p.precioCentavos,
    precioAnteriorCentavos: p.precioAnteriorCentavos,
    unidadVenta: p.unidadVenta,
    presentacion: p.presentacion,
    descripcionCorta: p.descripcionCorta,
    descripcionLarga: p.descripcionLarga,
    detallesEmpaque: p.detallesEmpaque,
    badge: p.badge,
    disponible: p.disponible,
  }
}

/** Conteo de resultados por opción de filtro (para el sidebar). */
function contarPor(
  campo: "categoriaSlug" | "marca" | "presentacion"
): FiltroOpcion[] {
  const mapa = new Map<string, number>()
  for (const p of productosCatalogo) {
    const valor = p[campo]
    mapa.set(valor, (mapa.get(valor) ?? 0) + 1)
  }
  return Array.from(mapa, ([value, count]) => ({
    value,
    label: value,
    count,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"))
}

export function CatalogoView() {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(filtrosIniciales)
  const [orden, setOrden] = useState<OrdenCatalogo>("relevancia")
  const [pagina, setPagina] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const filtrosScrollRef = useRef<HTMLDivElement>(null)

  const opciones = useMemo(
    () => ({
      categorias: contarPor("categoriaSlug"),
      marcas: contarPor("marca"),
      presentaciones: contarPor("presentacion"),
    }),
    []
  )

  // Los filtros son SOLO VISUALES (data mockeada): se seleccionan en el
  // panel pero NO filtran el grid — siempre se muestran todos los productos,
  // solo cambia el ORDEN. `filtros` se conserva para el estado del panel.
  const resultados = useMemo(() => {
    const lista = [...productosCatalogo]
    switch (orden) {
      case "precio-asc":
        return lista.sort((a, b) => a.precioCentavos - b.precioCentavos)
      case "precio-desc":
        return lista.sort((a, b) => b.precioCentavos - a.precioCentavos)
      case "nombre":
        return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      default:
        return lista
    }
  }, [orden])

  const totalPaginas = Math.max(1, Math.ceil(resultados.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const visibles = resultados.slice(
    (paginaSegura - 1) * PAGE_SIZE,
    paginaSegura * PAGE_SIZE
  )
  const inicio =
    resultados.length === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1
  const fin = Math.min(paginaSegura * PAGE_SIZE, resultados.length)

  /** Aplica la selección del panel (solo visual — no filtra el grid). */
  const aplicarFiltros = (nuevos: FiltrosCatalogo) => {
    setFiltros(nuevos)
    setPagina(1)
  }

  const cambiarOrden = (nuevoOrden: OrdenCatalogo) => {
    setOrden(nuevoOrden)
    setPagina(1)
  }

  const irAPagina = (target: number) => {
    setPagina(target)
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
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

  const filtrosProps = {
    filtros,
    onChange: aplicarFiltros,
    categorias: opciones.categorias,
    marcas: opciones.marcas,
    presentaciones: opciones.presentaciones,
    scrollRef: filtrosScrollRef,
  }

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
          Portafolio completo JDH: alimentos, bebidas, aseo y más para
          operaciones institucionales, con precios de lista pública.
        </p>
      </header>

      {/* El panel de filtros arranca DESDE debajo de "Todos los productos". */}
      <div
        ref={gridRef}
        className="grid scroll-mt-[calc(var(--catalogo-chrome-height)+1rem)] grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]"
      >
        {/* Filtros: panel NEGRO fijo (header/contenido/footer inmutables) con
            scroll interno que responde a la rueda en toda la zona izquierda. */}
        <aside
          ref={asideRef}
          className="lg:sticky lg:top-[calc(var(--catalogo-chrome-height)+1rem)] lg:self-start"
        >
          <CatalogFilters {...filtrosProps} />
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Banner de imágenes de producto, al tamaño de la lista. */}
          <CatalogBannerCarousel />

          {/* Barra de resultados: recuento + orden. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {formatNumero(inicio)}–{formatNumero(fin)}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">
                {formatNumero(resultados.length)}
              </span>{" "}
              productos
            </p>
            <OrdenDropdown value={orden} onChange={cambiarOrden} />
          </div>

          {/* Grid de resultados (sin modal — solo homepage). */}
          {resultados.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Sin resultados"
              description="El catálogo está vacío en este momento."
            >
              <JdhButton
                variant="secondary"
                size="sm"
                onClick={() => setFiltros(filtrosIniciales)}
              >
                Limpiar filtros
              </JdhButton>
            </EmptyState>
          ) : (
            <Stagger
              staggerDelay={0.04}
              className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
            >
              {visibles.map((producto) => (
                <StaggerItem key={producto.id} className="h-full">
                  <ProductCard
                    producto={aCardData(producto)}
                    variant="placeholder"
                    conModal={false}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <Pagination
            page={paginaSegura}
            totalPages={totalPaginas}
            onPageChange={irAPagina}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  )
}
