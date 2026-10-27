"use client"

import Link from "next/link"
import {
  useMarcas,
  useProveedores,
} from "@/modules/catalogo/hooks/use-productos"
import { marcaHref, proveedorHref } from "@/modules/catalogo/navigation"
import { formatNombreComercial } from "@/lib/format"

/** Se monta al abrir el menu; reutiliza la cache del catalogo y del header. */
export function MegaMenuCatalogo({ onNavigate }: { onNavigate: () => void }) {
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
