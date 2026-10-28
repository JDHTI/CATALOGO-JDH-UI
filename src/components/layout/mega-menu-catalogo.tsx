"use client"

import Link from "next/link"
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
import { formatNombreComercial } from "@/lib/format"

/** Subcategorías visibles por categoría; el resto se alcanza desde su página. */
const MAX_SUBCATEGORIAS = 6

/** Se monta al abrir el menu; reutiliza la cache del catalogo y del header. */
export function MegaMenuCatalogo({ onNavigate }: { onNavigate: () => void }) {
  const categorias = useCategorias()
  const marcas = useMarcas()
  const proveedores = useProveedores()
  const grupos = [
    {
      id: "marcas",
      titulo: "Marcas",
      query: marcas,
      enlaces: (marcas.data ?? []).map((marca) => ({
        id: marca.id,
        nombre: marca.nombre,
        href: marcaHref(marca),
      })),
    },
    {
      id: "proveedores",
      titulo: "Proveedores",
      query: proveedores,
      enlaces: (proveedores.data ?? []).map((proveedor) => ({
        id: proveedor.id,
        nombre: proveedor.nombre,
        href: proveedorHref(proveedor),
      })),
    },
  ]

  return (
    <div className="col-span-full grid gap-6 border-b border-border pb-4 sm:grid-cols-2">
      <CategoriasMenu query={categorias} onNavigate={onNavigate} />
      {grupos.map(({ id, titulo, query, enlaces }) => (
        <section
          key={id}
          aria-labelledby={`mega-menu-${id}`}
          className="min-w-0 space-y-3"
        >
          <h2 id={`mega-menu-${id}`} className="text-base font-bold">
            {titulo}
          </h2>
          {query.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              Cargando {titulo.toLowerCase()}...
            </p>
          ) : query.isError && enlaces.length === 0 ? (
            <div className="space-y-2 text-sm">
              <p role="status">No pudimos cargar {titulo.toLowerCase()}.</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="rounded font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                Reintentar {titulo.toLowerCase()}
              </button>
            </div>
          ) : enlaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay {titulo.toLowerCase()} disponibles.
            </p>
          ) : (
            <ul className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto overscroll-contain lg:grid-cols-2">
              {enlaces.map((enlace) => (
                <li key={enlace.id}>
                  <Link
                    href={enlace.href}
                    onClick={onNavigate}
                    className="block rounded-md p-2 text-sm break-words transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                  >
                    {formatNombreComercial(enlace.nombre)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

/**
 * Categorías del API (`GET /categories`) con sus subcategorías: la misma
 * taxonomía del panel de filtros, nunca una lista propia. Ocupa el ancho
 * completo y va ANTES de marcas y proveedores — que no se quitan: son los
 * otros dos ejes con los que se llega al mismo catálogo.
 *
 * Si la consulta falla o no hay categorías, el bloque se omite entero en vez de
 * mostrar un error: el menú sigue siendo útil por marca y proveedor.
 */
function CategoriasMenu({
  query,
  onNavigate,
}: {
  query: ReturnType<typeof useCategorias>
  onNavigate: () => void
}) {
  const categorias = query.data ?? []
  if (query.isError && categorias.length === 0) return null
  if (!query.isPending && categorias.length === 0) return null

  return (
    <section
      aria-labelledby="mega-menu-categorias"
      className="min-w-0 space-y-3 sm:col-span-2"
    >
      <h2 id="mega-menu-categorias" className="text-base font-bold">
        Categorías
      </h2>
      {query.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando categorías...
        </p>
      ) : (
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categorias.map((categoria) => {
            const Icono = iconoCategoria(categoria.slug)
            const visibles = categoria.subcategorias.slice(0, MAX_SUBCATEGORIAS)
            const ocultas = categoria.subcategorias.length - visibles.length
            return (
              <li key={categoria.id} className="min-w-0 space-y-1">
                <Link
                  href={categoriaHref(categoria)}
                  onClick={onNavigate}
                  className="flex items-center gap-2 rounded-md p-1.5 text-sm font-medium break-words transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <Icono className="size-4 shrink-0" aria-hidden="true" />
                  {formatNombreComercial(categoria.nombre)}
                </Link>
                {visibles.length > 0 ? (
                  <ul className="space-y-0.5 pl-7">
                    {visibles.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={subcategoriaHref(categoria, sub)}
                          onClick={onNavigate}
                          className="block rounded-md px-1.5 py-1 text-xs break-words text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:bg-accent"
                        >
                          {formatNombreComercial(sub.nombre)}
                        </Link>
                      </li>
                    ))}
                    {ocultas > 0 ? (
                      <li>
                        <Link
                          href={categoriaHref(categoria)}
                          onClick={onNavigate}
                          className="block rounded-md px-1.5 py-1 text-xs font-medium underline-offset-4 transition-colors outline-none hover:underline focus-visible:bg-accent"
                        >
                          Ver las {categoria.subcategorias.length} subcategorías
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
