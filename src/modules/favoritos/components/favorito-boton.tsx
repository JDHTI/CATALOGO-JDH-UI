"use client"

import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"

import { useAlternarFavorito, useEsFavorito } from "../hooks/use-favoritos"

/**
 * Botón de favorito (corazón) sobre una card o en la ficha de producto.
 *
 * NO se pinta cuando la sesión no tiene favoritos disponibles —visitante
 * anónimo, usuario sin el permiso, o API que aún no publica el endpoint—. Un
 * corazón que al pulsarlo manda a iniciar sesión es una promesa rota; en el
 * catálogo público sencillamente no existe.
 *
 * Se detiene la propagación y el default del clic porque en el listado este
 * botón va SUPERPUESTO a la card, que entera es un enlace al detalle: sin
 * esto, marcar un favorito navegaría. Va como hermano del enlace y no dentro,
 * porque anidar un botón en un enlace es HTML inválido y deja el foco y los
 * lectores de pantalla en un estado ambiguo.
 */
export function FavoritoBoton({
  productoId,
  nombreProducto,
  className,
  mostrarTexto = false,
}: {
  productoId: string
  /** Para la etiqueta accesible: "Quitar X de favoritos". */
  nombreProducto: string
  className?: string
  mostrarTexto?: boolean
}) {
  const { esFavorito, activo } = useEsFavorito(productoId)
  const alternar = useAlternarFavorito()

  const etiqueta = !activo
    ? `Favoritos no disponibles para ${nombreProducto}`
    : esFavorito
      ? `Quitar ${nombreProducto} de favoritos`
      : `Agregar ${nombreProducto} a favoritos`

  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={activo ? esFavorito : undefined}
      disabled={!activo || alternar.isPending}
      onClick={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        alternar.mutate({ productoId, esFavorito })
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-muted-foreground transition-colors hover:border-[var(--color-border-strong)] hover:text-foreground",
        esFavorito && activo && "text-foreground",
        (!activo || alternar.isPending) && "cursor-not-allowed opacity-50",
        mostrarTexto && "h-10 w-auto gap-2 rounded-lg px-4 text-sm font-medium",
        className
      )}
    >
      <Heart
        className={cn("size-[18px]", esFavorito && "fill-current")}
        aria-hidden="true"
      />
      {mostrarTexto
        ? esFavorito
          ? "Quitar de favoritos"
          : "Agregar a favoritos"
        : null}
    </button>
  )
}
