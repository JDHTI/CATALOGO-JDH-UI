"use client"

import Image from "next/image"
import { useState } from "react"
import { Heart, Package, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { JdhButton } from "@/components/common/jdh-button"
import { formatCentavos } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ProductDetailModal } from "./product-detail-modal"

/** Datos mínimos que toda card de producto necesita (homepage y listado). */
export interface ProductCardData {
  id: string
  nombre: string
  categoria: string
  marca: string
  /** Precio de lista en CENTAVOS de COP. */
  precioCentavos: number
  /** Precio anterior para tachado en ofertas. */
  precioAnteriorCentavos?: number
  unidadVenta: string
  presentacion: string
  descripcionCorta: string
  descripcionLarga: string
  detallesEmpaque: string[]
  /** Foto del producto — si falta, la card muestra un placeholder. */
  imagen?: string
  badge?: "Nuevo" | "Oferta" | "Más vendido"
  disponible?: boolean
}

/**
 * Card de producto compartida por el homepage (variante "imagen", con modal
 * de detalle al hacer clic) y el listado de /productos (variante
 * "placeholder", SIN modal — el modal solo aplica en la homepage).
 *
 * El área de la imagen NUNCA es un `<button>`: cuando `conModal` usa un
 * `div` con `role="button"` + `tabIndex` + teclado (Enter/Espacio), porque
 * el corazón de favoritos es un botón hijo — un `<button>` dentro de otro
 * `<button>` es HTML inválido y React lo rechaza en runtime. El corazón hace
 * `stopPropagation` para no abrir el modal.
 */
export function ProductCard({
  producto,
  variant = "imagen",
  conModal = true,
}: {
  producto: ProductCardData
  variant?: "imagen" | "placeholder"
  /** Solo la homepage abre el modal de detalle. */
  conModal?: boolean
}) {
  const [favorito, setFavorito] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)

  const sinFoto = variant === "placeholder" || !producto.imagen

  return (
    <>
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-[var(--jdh-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          conModal && "cursor-pointer"
        )}
      >
        <div
          {...(conModal
            ? {
                role: "button" as const,
                tabIndex: 0,
                onClick: () => setModalAbierto(true),
                onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setModalAbierto(true)
                  }
                },
                "aria-label": `Ver detalle de ${producto.nombre}`,
              }
            : {})}
          className={cn(
            "relative block w-full overflow-hidden bg-[var(--color-surface-subtle)] text-muted-foreground",
            sinFoto ? "aspect-[4/3]" : "aspect-square"
          )}
        >
          {sinFoto ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Package className="size-12" aria-hidden="true" />
              <span className="px-4 text-center text-xs text-muted-foreground">
                {producto.categoria}
              </span>
            </span>
          ) : (
            <Image
              src={producto.imagen!}
              alt={producto.nombre}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105"
            />
          )}

          {producto.badge ? (
            <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border border-transparent bg-primary px-2.5 text-xs font-medium whitespace-nowrap text-primary-foreground">
              {producto.badge}
            </span>
          ) : null}

          {producto.disponible === false ? (
            <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
              Agotado
            </span>
          ) : null}

          <button
            type="button"
            aria-label={
              favorito ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            aria-pressed={favorito}
            onClick={(event) => {
              event.stopPropagation()
              setFavorito((v) => !v)
              toast(
                favorito ? "Eliminado de favoritos" : "Agregado a favoritos",
                {
                  description: producto.nombre,
                }
              )
            }}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Heart
              aria-hidden="true"
              className={cn("size-4", favorito && "fill-foreground")}
            />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {producto.categoria}
            </p>
            <h3 className="text-sm font-medium text-balance">
              {producto.nombre}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {producto.unidadVenta}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2">
            <p className="flex flex-col">
              <span className="text-base font-bold">
                {formatCentavos(producto.precioCentavos)}
              </span>
              {producto.precioAnteriorCentavos ? (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCentavos(producto.precioAnteriorCentavos)}
                </span>
              ) : null}
            </p>
            <JdhButton
              variant="secondary"
              size="sm"
              className="min-h-11 sm:min-h-8"
              disabled={producto.disponible === false}
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

      {conModal ? (
        <ProductDetailModal
          producto={producto}
          open={modalAbierto}
          onOpenChange={setModalAbierto}
        />
      ) : null}
    </>
  )
}
