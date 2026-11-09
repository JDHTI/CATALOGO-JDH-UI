"use client"

import * as React from "react"
import type { Route } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ChevronRight, Store, Tags } from "lucide-react"

import {
  useCategorias,
  useMarcas,
  useProveedores,
} from "@/modules/catalogo/hooks/use-productos"
import { iconoCategoria } from "@/modules/catalogo/categorias"
import {
  categoriaHref,
  marcaHref,
  proveedorHref,
  subcategoriaHref,
} from "@/modules/catalogo/navigation"
import type { Categoria } from "@/modules/catalogo/types"
import { formatNombreComercial, formatNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Subcategorías con más productos que se destacan arriba del panel. */
const MAX_DESTACADAS = 3
/** Marcas / proveedores que caben en el panel sin scroll; el resto se busca en
 *  el panel de filtros del catálogo, que sí tiene buscador. */
const MAX_COMERCIALES = 18

const ID_MARCAS = "marcas"
const ID_PROVEEDORES = "proveedores"
const idCategoria = (categoria: Pick<Categoria, "id">) => `cat-${categoria.id}`

const CLASES_ENLACE =
  "rounded-md outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

/**
 * Cuerpo del megamenú: navegación por categorías al estilo de los
 * marketplaces grandes. Columna izquierda con las categorías (más Marcas y
 * Proveedores) y panel derecho con lo de la elegida — así el menú tiene alto
 * FIJO sin importar cuántas categorías o subcategorías haya, en vez de crecer
 * con ellas y obligar a hacer scroll.
 *
 * Es un patrón de PESTAÑAS VERTICALES (WAI-ARIA tabs, activación automática):
 * una sola parada de Tab en la lista (la pestaña activa), flechas ↑/↓ y
 * Inicio/Fin para moverse entre pestañas, y Tab pasa al panel. Con puntero, el
 * hover cambia de pestaña tras una pausa corta para que cruzar en diagonal
 * hacia el panel no la cambie al pasar.
 *
 * Por debajo de `md` no caben dos columnas: se navega en dos pasos (lista de
 * categorías → su panel, con botón para volver).
 *
 * Las categorías vienen del API (`GET /categories`) y se editan sin desplegar
 * la UI. Si fallan, quedan Marcas y Proveedores. Se monta al abrir el menú y
 * reutiliza la caché del catálogo y del header.
 */
export function MegaMenuCatalogo({ onNavigate }: { onNavigate: () => void }) {
  const categorias = useCategorias()
  const marcas = useMarcas()
  const proveedores = useProveedores()

  const lista = categorias.data ?? []
  const hayCategorias = lista.length > 0
  // Tras un error sin datos no hay categorías que esperar ni que reintentar.
  const categoriasCargando = categorias.isPending

  const ids = [...lista.map(idCategoria), ID_MARCAS, ID_PROVEEDORES]
  const [elegido, setElegido] = React.useState<string | null>(null)
  // Si lo elegido ya no existe (cambió el árbol), manda la primera pestaña.
  const activo = elegido && ids.includes(elegido) ? elegido : ids[0]
  // Solo móvil: ¿se ve la lista o el panel?
  const [vistaMovil, setVistaMovil] = React.useState<"lista" | "panel">("lista")

  const pausa = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(
    () => () => {
      if (pausa.current) clearTimeout(pausa.current)
    },
    []
  )

  const seleccionar = (id: string) => {
    setElegido(id)
    setVistaMovil("panel")
  }
  const alEntrarConPuntero = (id: string) => {
    if (pausa.current) clearTimeout(pausa.current)
    pausa.current = setTimeout(() => setElegido(id), 90)
  }
  const alSalirConPuntero = () => {
    if (pausa.current) clearTimeout(pausa.current)
  }

  const alTeclear = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const i = ids.indexOf(activo)
    const destino =
      event.key === "ArrowDown"
        ? (i + 1) % ids.length
        : event.key === "ArrowUp"
          ? (i - 1 + ids.length) % ids.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? ids.length - 1
              : -1
    if (destino < 0) return
    event.preventDefault()
    setElegido(ids[destino])
    // El foco sigue a la pestaña: la activa es la única con tabIndex=0.
    event.currentTarget
      .querySelector<HTMLElement>(`[data-tab="${ids[destino]}"]`)
      ?.focus()
  }

  const categoriaActiva = lista.find((c) => idCategoria(c) === activo)

  return (
    <div className="col-span-full grid gap-x-6 gap-y-4 md:grid-cols-[15rem_minmax(0,1fr)]">
      {/* ——— Pestañas ——— */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          vistaMovil === "panel" && "max-md:hidden"
        )}
      >
        <p
          id="mega-menu-categorias"
          className="px-2 pb-1 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase"
        >
          Categorías
        </p>
        {categoriasCargando ? (
          <p
            role="status"
            className="px-2 py-1.5 text-sm text-muted-foreground"
          >
            Cargando categorías...
          </p>
        ) : null}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-labelledby="mega-menu-categorias"
          onKeyDown={alTeclear}
          className="flex flex-col gap-0.5"
        >
          {lista.map((categoria) => {
            const Icono = iconoCategoria(categoria.slug)
            return (
              <Pestana
                key={categoria.id}
                id={idCategoria(categoria)}
                href={categoriaHref(categoria)}
                onNavigate={onNavigate}
                activa={activo === idCategoria(categoria)}
                onSeleccionar={seleccionar}
                onPuntero={alEntrarConPuntero}
                onSalirPuntero={alSalirConPuntero}
              >
                <Icono className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  {formatNombreComercial(categoria.nombre)}
                </span>
              </Pestana>
            )
          })}

          {/* Marcas y proveedores son OTROS ejes del mismo catálogo: van en
              la misma lista, separados, no en secciones largas aparte. */}
          <div
            role="presentation"
            className={cn(
              "my-1 border-t border-border",
              !hayCategorias && "hidden"
            )}
          />
          <Pestana
            id={ID_MARCAS}
            activa={activo === ID_MARCAS}
            onSeleccionar={seleccionar}
            onPuntero={alEntrarConPuntero}
            onSalirPuntero={alSalirConPuntero}
          >
            <Tags className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Marcas</span>
          </Pestana>
          <Pestana
            id={ID_PROVEEDORES}
            activa={activo === ID_PROVEEDORES}
            onSeleccionar={seleccionar}
            onPuntero={alEntrarConPuntero}
            onSalirPuntero={alSalirConPuntero}
          >
            <Store className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Proveedores</span>
          </Pestana>
        </div>
      </div>

      {/* ——— Panel ——— */}
      <div
        role="tabpanel"
        id="mega-menu-tabpanel"
        aria-labelledby={`mega-menu-tab-${activo}`}
        className={cn(
          "min-w-0 md:border-l md:border-border md:pl-6",
          vistaMovil === "lista" && "max-md:hidden"
        )}
      >
        <button
          type="button"
          onClick={() => setVistaMovil("lista")}
          className="mb-3 inline-flex items-center gap-1.5 rounded-md py-1 pr-2 text-sm font-medium outline-none hover:underline focus-visible:outline-2 focus-visible:outline-ring md:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a categorías
        </button>

        {categoriaActiva ? (
          <PanelCategoria categoria={categoriaActiva} onNavigate={onNavigate} />
        ) : activo === ID_MARCAS ? (
          <PanelComercial
            titulo="Marcas"
            query={marcas}
            enlaces={(marcas.data ?? [])
              .slice()
              .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
              .map((marca) => ({
                id: marca.id,
                nombre: marca.nombre,
                href: marcaHref(marca),
              }))}
            onNavigate={onNavigate}
          />
        ) : (
          <PanelComercial
            titulo="Proveedores"
            query={proveedores}
            enlaces={(proveedores.data ?? [])
              .slice()
              .sort((a, b) => (b.totalProductos ?? 0) - (a.totalProductos ?? 0))
              .map((proveedor) => ({
                id: proveedor.id,
                nombre: proveedor.nombre,
                href: proveedorHref(proveedor),
              }))}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Pestaña de la lista. Con `href` (las categorías) es un enlace de verdad: en
 * escritorio el clic navega a la categoría completa —el hover ya abre su
 * panel, así que el clic no tiene otro trabajo— y conserva clic medio y
 * "abrir en pestaña nueva". Por debajo de `md` el flujo es de dos pasos, y ahí
 * el toque solo abre el panel. Sin `href` (Marcas, Proveedores) es un botón.
 */
function Pestana({
  id,
  href,
  onNavigate,
  activa,
  onSeleccionar,
  onPuntero,
  onSalirPuntero,
  children,
}: {
  id: string
  href?: Route
  onNavigate?: () => void
  activa: boolean
  onSeleccionar: (id: string) => void
  onPuntero: (id: string) => void
  onSalirPuntero: () => void
  children: React.ReactNode
}) {
  const propiedades = {
    role: "tab",
    id: `mega-menu-tab-${id}`,
    "data-tab": id,
    "aria-selected": activa,
    "aria-controls": "mega-menu-tabpanel",
    // Roving tabindex: la lista entera es UNA parada de Tab.
    tabIndex: activa ? 0 : -1,
    onPointerEnter: (event: React.PointerEvent) => {
      // Solo ratón: en táctil, el "hover" sintético mandaría el panel sin
      // que el usuario haya tocado nada.
      if (event.pointerType === "mouse") onPuntero(id)
    },
    onPointerLeave: onSalirPuntero,
    className: cn(
      "flex h-9 w-full items-center gap-2.5 px-2 text-left text-sm md:h-8",
      CLASES_ENLACE,
      activa && "bg-accent font-medium"
    ),
  }
  const contenido = (
    <>
      {children}
      <ChevronRight
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-opacity",
          !activa && "md:opacity-0"
        )}
        aria-hidden="true"
      />
    </>
  )

  if (!href) {
    return (
      <button type="button" onClick={() => onSeleccionar(id)} {...propiedades}>
        {contenido}
      </button>
    )
  }

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (window.matchMedia("(min-width: 768px)").matches) {
          onNavigate?.()
          return
        }
        event.preventDefault()
        onSeleccionar(id)
      }}
      {...propiedades}
    >
      {contenido}
    </Link>
  )
}

/**
 * Panel de una categoría: título con acceso a TODA la categoría, las
 * subcategorías de mayor volumen destacadas y el resto en columnas. Las
 * destacadas salen del conteo del API: un dato real, no una selección
 * editorial que haya que mantener a mano.
 */
function PanelCategoria({
  categoria,
  onNavigate,
}: {
  categoria: Categoria
  onNavigate: () => void
}) {
  const porVolumen = categoria.subcategorias
    .slice()
    .sort((a, b) => b.totalProductos - a.totalProductos)
  const destacadas = porVolumen.slice(0, MAX_DESTACADAS)
  const idsDestacadas = new Set(destacadas.map((sub) => sub.id))
  // El resto conserva el orden de navegación del API, no el de volumen.
  const resto = categoria.subcategorias.filter((s) => !idsDestacadas.has(s.id))
  const nombre = formatNombreComercial(categoria.nombre)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">{nombre}</h2>
        <Link
          href={categoriaHref(categoria)}
          onClick={onNavigate}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium",
            CLASES_ENLACE
          )}
        >
          Ver todo en {nombre}
          <span className="text-muted-foreground">
            ({formatNumero(categoria.totalProductos)})
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {destacadas.length > 0 ? (
        <section aria-label={`Destacadas de ${nombre}`}>
          <p className="mb-2 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Destacadas
          </p>
          <ul className="grid gap-2 sm:grid-cols-3">
            {destacadas.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={subcategoriaHref(categoria, sub)}
                  onClick={onNavigate}
                  className="flex h-full flex-col justify-between gap-1 rounded-[var(--jdh-radius-md)] border border-border p-3 text-sm outline-none hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="font-medium break-words">
                    {formatNombreComercial(sub.nombre)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumero(sub.totalProductos)} productos
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resto.length > 0 ? (
        <section aria-label={`Más subcategorías de ${nombre}`}>
          <p className="mb-2 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Más subcategorías
          </p>
          <ul className="columns-1 gap-x-4 sm:columns-2 lg:columns-3">
            {resto.map((sub) => (
              <li key={sub.id} className="break-inside-avoid">
                <Link
                  href={subcategoriaHref(categoria, sub)}
                  onClick={onNavigate}
                  className={cn(
                    "block px-2 py-1 text-sm break-words",
                    CLASES_ENLACE
                  )}
                >
                  {formatNombreComercial(sub.nombre)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/**
 * Marcas o proveedores: los de mayor catálogo, en columnas y sin scroll. La
 * lista completa (con buscador) sigue en el panel de filtros de `/productos`,
 * que es donde sirve de verdad cuando hay cientos.
 */
function PanelComercial({
  titulo,
  query,
  enlaces,
  onNavigate,
}: {
  titulo: string
  query: {
    isPending: boolean
    isError: boolean
    refetch: () => unknown
  }
  enlaces: { id: string; nombre: string; href: ReturnType<typeof marcaHref> }[]
  onNavigate: () => void
}) {
  const minuscula = titulo.toLowerCase()
  const visibles = enlaces.slice(0, MAX_COMERCIALES)
  const restantes = enlaces.length - visibles.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">{titulo}</h2>
        <Link
          href="/productos"
          onClick={onNavigate}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium",
            CLASES_ENLACE
          )}
        >
          Ver todos los productos
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {query.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando {minuscula}...
        </p>
      ) : query.isError && enlaces.length === 0 ? (
        <div className="space-y-2 text-sm">
          <p role="status">No pudimos cargar {minuscula}.</p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="rounded font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Reintentar {minuscula}
          </button>
        </div>
      ) : enlaces.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay {minuscula} disponibles.
        </p>
      ) : (
        <>
          <ul className="columns-1 gap-x-4 sm:columns-2 lg:columns-3">
            {visibles.map((enlace) => (
              <li key={enlace.id} className="break-inside-avoid">
                <Link
                  href={enlace.href}
                  onClick={onNavigate}
                  className={cn(
                    "block px-2 py-1 text-sm break-words",
                    CLASES_ENLACE
                  )}
                >
                  {formatNombreComercial(enlace.nombre)}
                </Link>
              </li>
            ))}
          </ul>
          {restantes > 0 ? (
            <p className="px-2 text-xs text-muted-foreground">
              {restantes} más: búscalas en los filtros del catálogo.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
