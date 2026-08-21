"use client"

import Image from "next/image"
import { useState } from "react"
import { Check, Heart, Minus, Package, Plus, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { formatCentavos } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

import type { ProductCardData } from "./product-card"

/**
 * Modal de detalle de producto (solo homepage): GRANDE (sm:max-w-5xl) con la
 * imagen CONTENIDA — la foto vive dentro de su propio contenedor con un leve
 * padding hacia el marco del modal y borde redondeado, como una pieza
 * enmarcada. Incluye descripción larga, detalles de empaque detallados,
 * cantidad + añadir al carrito + favorito en la MISMA fila (todo mockeado
 * con toast). Radix Dialog con scroll interno en móvil.
 */
export function ProductDetailModal({
  producto,
  open,
  onOpenChange,
}: {
  producto: ProductCardData
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [cantidad, setCantidad] = useState(1)
  const [favorito, setFavorito] = useState(false)

  const foto = producto.imagen
  const badge = producto.badge

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="grid max-h-[85vh] overflow-y-auto sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Imagen VERTICAL (retrato 3/4): más alta que ancha, ocupa el
              alto de la columna y deja la foto enmarcada con padding sobre
              fondo BLANCO (sin superficie gris). */}
          <div className="p-4 sm:p-6">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--jdh-radius-md)] bg-[var(--color-surface)]">
              {foto ? (
                <Image
                  src={foto}
                  alt={producto.nombre}
                  fill
                  sizes="(min-width: 640px) 40vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Package className="size-16" aria-hidden="true" />
                  <span className="px-6 text-center text-sm">
                    {producto.categoria}
                  </span>
                </span>
              )}
              {badge ? (
                <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border border-transparent bg-primary px-2.5 text-xs font-medium whitespace-nowrap text-primary-foreground">
                  {badge}
                </span>
              ) : null}
            </div>
          </div>

          {/* Contenido (derecha en desktop). */}
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <DialogTitle className="text-base leading-none font-medium">
              <span className="sr-only">{producto.nombre}</span>
            </DialogTitle>

            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {producto.categoria} · {producto.marca}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-balance">
                {producto.nombre}
              </h3>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {formatCentavos(producto.precioCentavos)}
              </p>
              {producto.precioAnteriorCentavos ? (
                <p className="text-sm text-muted-foreground line-through">
                  {formatCentavos(producto.precioAnteriorCentavos)}
                </p>
              ) : null}
              {producto.disponible === false ? (
                <p className="text-sm font-medium text-muted-foreground">
                  · Agotado
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {producto.unidadVenta}
            </p>

            {/* Acciones en la MISMA fila: cantidad + añadir + favorito. */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 shrink-0 items-center rounded-[var(--jdh-radius-sm)] border border-[var(--color-border)]">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="flex size-11 items-center justify-center text-foreground transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40"
                  disabled={cantidad <= 1}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span
                  aria-live="polite"
                  className="w-8 text-center text-sm font-medium tabular-nums"
                >
                  {cantidad}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  onClick={() => setCantidad((c) => Math.min(99, c + 1))}
                  className="flex size-11 items-center justify-center text-foreground transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <JdhButton
                size="lg"
                className="min-h-11 flex-1 whitespace-nowrap"
                disabled={producto.disponible === false}
                onClick={() =>
                  toast.success(`Añadido al carrito (×${cantidad})`, {
                    description: producto.nombre,
                  })
                }
              >
                <ShoppingCart aria-hidden="true" />
                Añadir al carrito
              </JdhButton>
              <button
                type="button"
                aria-label={
                  favorito ? "Quitar de favoritos" : "Agregar a favoritos"
                }
                aria-pressed={favorito}
                onClick={() => {
                  setFavorito((v) => !v)
                  toast(
                    favorito
                      ? "Eliminado de favoritos"
                      : "Agregado a favoritos",
                    {
                      description: producto.nombre,
                    }
                  )
                }}
                className="flex size-11 shrink-0 items-center justify-center rounded-[var(--jdh-radius-sm)] border border-[var(--color-border)] text-foreground transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Heart
                  aria-hidden="true"
                  className={cn("size-5", favorito && "fill-foreground")}
                />
              </button>
            </div>

            <DialogDescription className="sr-only">
              Detalle del producto {producto.nombre}.
            </DialogDescription>

            <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
              <div className="flex flex-col gap-1">
                <h4 className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                  Descripción
                </h4>
                <p className="text-sm leading-relaxed text-foreground">
                  {producto.descripcionLarga}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                  Detalles de empaque
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {producto.detallesEmpaque.map((detalle) => (
                    <li
                      key={detalle}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-foreground"
                        aria-hidden="true"
                      />
                      {detalle}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
