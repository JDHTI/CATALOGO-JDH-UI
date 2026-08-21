"use client"

import { Package, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { formatCentavos } from "@/lib/format"

import type { ProductoDestacado } from "../types"

/**
 * Card de producto destacado SIN imagen (placeholder con icono `Package` en
 * superficie subtle), badge opcional, precio público formateado y botón
 * "Añadir" mockeado (toast, sin lógica de carrito). Interactiva con hover
 * según DESIGN.md §4.6.
 */
export function ProductCard({ producto }: { producto: ProductoDestacado }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[var(--color-surface-subtle)] text-muted-foreground">
        <Package className="size-10" aria-hidden="true" />
        {producto.badge ? (
          <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border border-transparent bg-primary px-2.5 text-xs font-medium whitespace-nowrap text-primary-foreground">
            {producto.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{producto.categoria}</p>
          <h3 className="text-sm font-medium text-balance">
            {producto.nombre}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">{producto.unidadVenta}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-base font-bold">
            {formatCentavos(producto.precioCentavos)}
          </p>
          <JdhButton
            variant="secondary"
            size="sm"
            className="min-h-11 sm:min-h-8"
            onClick={() =>
              toast.success("Añadido al carrito", {
                description: producto.nombre,
              })
            }
          >
            <ShoppingCart aria-hidden="true" />
            Añadir
          </JdhButton>
        </div>
      </div>
    </article>
  )
}
