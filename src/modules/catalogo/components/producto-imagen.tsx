"use client"

import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"

import { formatNombreComercial } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ImagenProducto, Producto } from "../types"

/**
 * Imagen de producto compartida por la card del listado, el detalle y la fila
 * de sugerencias del buscador. `imagenUrl` vendrá de un bucket S3 y al inicio
 * será null para la mayoría de productos: el placeholder es parte del diseño,
 * no un estado de error — monocromo (DESIGN.md), sobre el mismo fondo sutil
 * en ambos estados.
 *
 * El placeholder cubre DOS caminos, no uno: que no haya URL (`imagenUrl: null`,
 * el 99,9% del catálogo hoy) y que la URL responda 404. El segundo es real —
 * las filas viven en Postgres y los objetos en el bucket, y pueden divergir —
 * y es lo único que separa una recarga del bucket de un catálogo entero
 * pintando el ícono de imagen rota del navegador.
 *
 * Es `"use client"` por ese `onError`. No cuesta bundle: todos sus consumidores
 * (`ProductoCard`, `BusquedaSugerencias`, `ProductoGaleria`) ya viven dentro de
 * componentes cliente.
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
 *
 * `imagen` fija CUÁL de la galería se pinta, en vez de la primaria. Solo lo usa
 * `ProductoGaleria` (la tira de miniaturas del detalle); sin él el componente
 * elige la primaria, que es lo que quieren la card y el buscador.
 */
export function ProductoImagen({
  producto,
  imagen,
  sizes,
  className,
  priority = false,
  variant = "card",
}: {
  producto: Pick<Producto, "nombre" | "marca" | "imagenUrl" | "imagenes">
  /** Imagen concreta a mostrar. Por defecto, la primaria del producto. */
  imagen?: ImagenProducto | null
  /** `sizes` de next/image acorde al layout del caller. */
  sizes: string
  className?: string
  priority?: boolean
  variant?: "card" | "miniatura" | "detalle"
}) {
  /**
   * Una URL de imagen puede responder 404: el objeto puede faltar en el bucket
   * aunque la fila exista en Postgres, y durante una recarga del bucket faltan
   * TODAS a la vez, primarias incluidas. Sin esto el catálogo entero pintaría
   * el ícono de imagen rota del navegador en vez del placeholder de diseño.
   *
   * Se guarda la URL que falló en vez de un booleano: así, cuando cambia `src`
   * —otro producto, u otra imagen de la galería— el estado deja de aplicar
   * solo y se reintenta, sin `useEffect` de sincronización.
   */
  const [urlFallida, setUrlFallida] = useState<string | null>(null)

  const esMiniatura = variant === "miniatura"
  const elegida =
    imagen ??
    producto.imagenes.find((candidata) => candidata.esPrincipal) ??
    producto.imagenes[0]
  const src =
    (variant === "miniatura"
      ? elegida?.thumbUrl
      : variant === "detalle"
        ? elegida?.fullUrl
        : elegida?.cardUrl) ?? producto.imagenUrl
  const utilizable = src && src !== urlFallida

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-surface-subtle)]",
        className
      )}
    >
      {utilizable ? (
        <Image
          src={src}
          onError={() => setUrlFallida(src)}
          // El `alt` del API es descriptivo por imagen cuando existe; hoy llega
          // null en toda la galería, y ahí el nombre del producto es mejor que
          // un alt vacío.
          alt={elegida?.alt?.trim() || producto.nombre}
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
