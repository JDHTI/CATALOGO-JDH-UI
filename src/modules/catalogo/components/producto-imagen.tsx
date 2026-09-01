import Image from "next/image"
import { Package } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Producto } from "../types"

/**
 * Imagen de producto compartida por la card del listado, el detalle y la fila
 * de sugerencias del buscador. `imagenUrl` vendrá de un bucket S3 y al inicio
 * será null para la mayoría de productos: el placeholder es parte del diseño,
 * no un estado de error — monocromo (DESIGN.md), sobre el mismo fondo sutil
 * en ambos estados.
 *
 * El caller define la relación de aspecto y el `sizes` (depende del grid).
 *
 * `variant` decide CUÁNTO placeholder cabe Y qué variante de la imagen se
 * pide (`imagenes` trae 3 tamaños WebP — pedir la más chica que alcance
 * evita bajar el `full` de 1600px en una miniatura de 56px):
 * - `card` (por defecto): ícono grande + marca + "Imagen próximamente". Es el
 *   tratamiento para un recuadro de varios cientos de px. Pide `cardUrl`.
 * - `miniatura`: solo el ícono, a escala. En una miniatura de ~56px el texto
 *   de apoyo no se lee y solo ensucia la fila — el nombre y la marca ya van
 *   al lado, no hace falta repetirlos dentro del recuadro. Pide `thumbUrl`.
 * - `detalle`: el recuadro grande de la ficha de producto. Pide `fullUrl`.
 */
export function ProductoImagen({
  producto,
  sizes,
  className,
  priority = false,
  variant = "card",
}: {
  producto: Pick<Producto, "nombre" | "marca" | "imagenUrl" | "imagenes">
  /** `sizes` de next/image acorde al layout del caller. */
  sizes: string
  className?: string
  priority?: boolean
  variant?: "card" | "miniatura" | "detalle"
}) {
  const esMiniatura = variant === "miniatura"
  const principal =
    producto.imagenes.find((imagen) => imagen.esPrincipal) ??
    producto.imagenes[0]
  const src =
    (variant === "miniatura"
      ? principal?.thumbUrl
      : variant === "detalle"
        ? principal?.fullUrl
        : principal?.cardUrl) ?? producto.imagenUrl

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-surface-subtle)]",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={producto.nombre}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : esMiniatura ? (
        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Package
            className="size-5 opacity-60"
            strokeWidth={1.25}
            aria-hidden="true"
          />
        </span>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package
            className="size-10 opacity-70"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          {producto.marca ? (
            <span className="max-w-full truncate px-4 text-xs font-medium tracking-wide">
              {formatNombreComercial(producto.marca)}
            </span>
          ) : null}
          <span className="px-4 text-center text-[11px] text-muted-foreground/70">
            Imagen próximamente
          </span>
        </span>
      )}
    </div>
  )
}
