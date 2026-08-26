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
 * `variant` decide CUÁNTO placeholder cabe, no cómo se ve la foto:
 * - `card` (por defecto): ícono grande + marca + "Imagen próximamente". Es el
 *   tratamiento para un recuadro de varios cientos de px.
 * - `miniatura`: solo el ícono, a escala. En una miniatura de ~56px el texto
 *   de apoyo no se lee y solo ensucia la fila — el nombre y la marca ya van
 *   al lado, no hace falta repetirlos dentro del recuadro.
 */
export function ProductoImagen({
  producto,
  sizes,
  className,
  priority = false,
  variant = "card",
}: {
  producto: Pick<Producto, "nombre" | "marca" | "imagenUrl">
  /** `sizes` de next/image acorde al layout del caller. */
  sizes: string
  className?: string
  priority?: boolean
  variant?: "card" | "miniatura"
}) {
  const esMiniatura = variant === "miniatura"

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-surface-subtle)]",
        className
      )}
    >
      {producto.imagenUrl ? (
        <Image
          src={producto.imagenUrl}
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
