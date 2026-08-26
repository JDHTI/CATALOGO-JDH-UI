import Image from "next/image"
import { Package } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Producto } from "../types"

/**
 * Imagen de producto compartida por la card del listado y el detalle.
 * `imagenUrl` vendrá de un bucket S3 y al inicio será null para la mayoría
 * de productos: el placeholder es parte del diseño, no un estado de error —
 * monocromo (DESIGN.md), con el ícono de paquete y la marca como texto de
 * apoyo, sobre el mismo fondo sutil en ambos estados.
 *
 * El caller define la relación de aspecto y el `sizes` (depende del grid).
 */
export function ProductoImagen({
  producto,
  sizes,
  className,
  priority = false,
}: {
  producto: Pick<Producto, "nombre" | "marca" | "imagenUrl">
  /** `sizes` de next/image acorde al layout del caller. */
  sizes: string
  className?: string
  priority?: boolean
}) {
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
