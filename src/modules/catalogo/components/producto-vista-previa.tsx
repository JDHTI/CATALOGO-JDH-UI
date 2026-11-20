"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import type { Route } from "next"
import { ArrowRight } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { formatNombreComercial } from "@/lib/format"

import type { Producto } from "../types"
import { PrecioEmpleado } from "./precio-empleado"
import { ProductoImagen } from "./producto-imagen"

/**
 * Vista previa de un producto al pasar el ratón sobre su card: el nombre
 * completo (la card lo corta a dos renglones), la descripción y la ficha
 * resumida, sin salir del listado. La card sigue navegando al detalle con un
 * clic, y la vista previa trae su propio «Ver detalle».
 *
 * Es una mejora SOLO para puntero fino, y así lo garantiza Radix:
 * - En táctil no se abre (`excludeTouch`): el tap navega como siempre.
 * - Al tabular sí se abre (foco en el enlace), pero Radix saca del orden de
 *   tabulación todo lo enfocable del contenido. El teclado no queda atrapado
 *   en la vista previa: el enlace de la card ya lleva al mismo destino.
 *
 * `openDelay` alto a propósito: recorrer una grilla con el ratón no debe ir
 * abriendo una vista previa por cada card que se cruza.
 */
export function ProductoVistaPrevia({
  producto,
  children,
}: {
  producto: Producto
  /** El contenedor de la card. Debe aceptar `ref` y props (un elemento DOM). */
  children: ReactNode
}) {
  const href = `/productos/${encodeURIComponent(producto.id)}` as Route
  const categoria = [producto.categoria?.nombre, producto.subcategoria?.nombre]
    .filter(Boolean)
    .join(" › ")
  const filas = [
    ["Proveedor", formatNombreComercial(producto.proveedor.nombre)],
    ["Fabricante", formatNombreComercial(producto.fabricante)],
    ["Categoría", categoria],
  ].filter(([, valor]) => valor)

  return (
    <HoverCard openDelay={700} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={16}
        className="flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-4 p-4"
      >
        <div className="flex gap-3">
          <ProductoImagen
            producto={producto}
            sizes="112px"
            className="aspect-square w-28 shrink-0 rounded-[var(--jdh-radius-sm)]"
          />
          <div className="flex min-w-0 flex-col gap-1">
            {producto.marca ? (
              <p className="truncate text-xs font-medium tracking-wide text-muted-foreground">
                {formatNombreComercial(producto.marca)}
              </p>
            ) : null}
            <p className="text-sm font-medium break-words">{producto.nombre}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              SKU {producto.sku}
            </p>
          </div>
        </div>

        {producto.descripcionLarga ? (
          <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {producto.descripcionLarga}
          </p>
        ) : null}

        {filas.length > 0 ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
            {filas.map(([termino, valor]) => (
              <div key={termino} className="contents">
                <dt className="text-muted-foreground">{termino}</dt>
                <dd className="font-medium break-words">{valor}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex items-end justify-between gap-3 border-t border-[var(--color-border)] pt-3">
          <PrecioEmpleado producto={producto} variante="card" />
          <JdhButton asChild size="sm" className="ml-auto shrink-0">
            <Link href={href}>
              Ver detalle
              <ArrowRight aria-hidden="true" />
            </Link>
          </JdhButton>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
