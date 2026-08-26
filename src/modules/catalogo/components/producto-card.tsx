import Link from "next/link"
import type { Route } from "next"
import { Store } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"

import type { Producto } from "../types"
import { ProductoImagen } from "./producto-imagen"

/**
 * Card de producto del catálogo — única card de producto de la app, usada
 * por el listado (`/productos`) y por la muestra del homepage. El catálogo
 * es solo referencia visual: identifica el producto (imagen, marca, nombre,
 * sku) y su proveedor, el eje principal de clasificación. Toda la card
 * navega al detalle.
 */
export function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <article className="group h-full overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,transform] duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
      <Link
        href={`/productos/${producto.id}` as Route}
        aria-label={`Ver detalle de ${producto.nombre}`}
        className="flex h-full flex-col focus-visible:outline-none"
      >
        <ProductoImagen
          producto={producto}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="aspect-[4/3] w-full"
        />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-col gap-1">
            {/* La marca va SIN `uppercase`: el nombre real del ERP ya viene
                en mayúsculas y puede traer forma jurídica ("NESTLE DE
                COLOMBIA S.A."); forzarlas otra vez lo hace ilegible. */}
            {producto.marca ? (
              <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
                {formatNombreComercial(producto.marca)}
              </p>
            ) : null}
            <h3 className="text-sm font-medium text-balance">
              {producto.nombre}
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">
              {producto.sku}
            </p>
          </div>

          {/* SLOT DE PRECIO (oculto a propósito): sin precios definidos en el
              backend todavía. Cuando existan, el bloque va aquí, encima del
              proveedor, resuelto vía PriceContext — nunca improvisado. */}

          <p className="mt-auto flex items-center gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {formatNombreComercial(producto.proveedor.nombre)}
            </span>
          </p>
        </div>
      </Link>
    </article>
  )
}

/** Esqueleto de la card mientras responde el API (misma silueta). */
export function ProductoCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-full animate-pulse overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="aspect-[4/3] w-full bg-[var(--color-surface-subtle)]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-4 w-4/5 rounded bg-[var(--color-surface-subtle)]" />
        <div className="h-3 w-24 rounded bg-[var(--color-surface-subtle)]" />
        <div className="mt-3 h-3 w-28 rounded bg-[var(--color-surface-subtle)]" />
      </div>
    </div>
  )
}
