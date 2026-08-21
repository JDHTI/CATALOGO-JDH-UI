"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { formatCentavos } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ProductoDestacado } from "../types"

/**
 * Card de producto destacado con foto CUADRADA (aspect-square) más grande,
 * badge opcional, botón de favoritos (corazón sobre la imagen — estado local
 * + toast, sin lógica real) y botón "Añadir" al carrito que prevalece
 * (mockeado con toast). Categoría, nombre, número por empaque y precio se
 * conservan. Interactiva con hover según DESIGN.md §4.6.
 */
export function ProductCard({ producto }: { producto: ProductoDestacado }) {
  const [favorito, setFavorito] = useState(false)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]">
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-subtle)]">
        <Image
          src={producto.imagen}
          alt={producto.nombre}
          fill
          sizes="(min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105"
        />
        {producto.badge ? (
          <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border border-transparent bg-primary px-2.5 text-xs font-medium whitespace-nowrap text-primary-foreground">
            {producto.badge}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={favorito}
          onClick={() => {
            setFavorito((v) => !v)
            toast(
              favorito ? "Eliminado de favoritos" : "Agregado a favoritos",
              {
                description: producto.nombre,
              }
            )
          }}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Heart
            aria-hidden="true"
            className={cn("size-4", favorito && "fill-foreground")}
          />
        </button>
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
