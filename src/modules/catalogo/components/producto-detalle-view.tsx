import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import { JdhButton } from "@/components/common/jdh-button"
import { formatNombreComercial } from "@/lib/format"

import type { Producto } from "../types"
import { ProductoGaleria } from "./producto-galeria"
import { ProductoDescripcion } from "./producto-descripcion"

/**
 * Detalle de un producto real del API. El catálogo es referencia visual para
 * vendedores y clientes: identifica el producto (foto, sku, marca,
 * fabricante, proveedor) — SIN precio ni compra. Cuando el backend defina
 * precios, el slot va debajo del encabezado (ver comentario en el JSX).
 */
export function ProductoDetalleView({ producto }: { producto: Producto }) {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: producto.nombre },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* `key`: la galería guarda cuál miniatura está activa, y al navegar
            de un producto a otro React reutilizaría la instancia con el índice
            de la anterior. */}
        <ProductoGaleria key={producto.id} producto={producto} />

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            {producto.marca ? (
              <p className="text-xs font-medium tracking-wide text-muted-foreground">
                {formatNombreComercial(producto.marca)}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              {producto.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">
              Código: <span className="tabular-nums">{producto.sku}</span>
            </p>
          </header>

          {/* SLOT DE PRECIO (oculto a propósito): los precios aún no están
              definidos en el backend. Cuando existan, aquí va el bloque de
              precio según la audiencia del PriceContext — nunca antes. */}

          <ProductoDescripcion texto={producto.descripcionLarga} />

          <FichaTecnica producto={producto} />

          <div>
            <JdhButton asChild variant="secondary" size="sm">
              <Link href="/productos">
                <ArrowLeft aria-hidden="true" />
                Volver a productos
              </Link>
            </JdhButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Ficha de identificación — pares término/valor en grid, monocromo. */
function FichaTecnica({ producto }: { producto: Producto }) {
  // Los nombres comerciales llegan del ERP en mayúsculas sostenidas.
  const filas: { termino: string; valor: string | null }[] = [
    { termino: "Descripción ERP", valor: producto.descripcion || null },
    {
      termino: "Marca",
      valor: producto.marca ? formatNombreComercial(producto.marca) : null,
    },
    {
      termino: "Fabricante",
      valor: producto.fabricante
        ? formatNombreComercial(producto.fabricante)
        : null,
    },
    {
      termino: "Proveedor",
      valor: formatNombreComercial(producto.proveedor.nombre),
    },
    { termino: "Categoría", valor: producto.categoria?.nombre ?? null },
    { termino: "Subcategoría", valor: producto.subcategoria?.nombre ?? null },
  ].filter((f) => f.valor)

  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] sm:grid-cols-2">
      {filas.map(({ termino, valor }) => (
        <div
          key={termino}
          className="flex flex-col gap-0.5 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 sm:nth-last-2:border-b-0"
        >
          <dt className="text-xs text-muted-foreground">{termino}</dt>
          <dd className="text-sm font-medium">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Esqueleto del detalle mientras responde el API. */
export function DetalleSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando producto"
      className="flex animate-pulse flex-col gap-6"
    >
      <span className="sr-only">Cargando producto…</span>
      <div className="h-4 w-64 rounded bg-[var(--color-surface-subtle)]" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-8 w-3/4 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-4 w-40 rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-20 w-full rounded bg-[var(--color-surface-subtle)]" />
          <div className="h-40 w-full rounded-[var(--jdh-radius-md)] bg-[var(--color-surface-subtle)]" />
        </div>
      </div>
    </div>
  )
}
