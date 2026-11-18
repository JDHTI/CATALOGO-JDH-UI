import { BadgeCheck } from "lucide-react"

import { formatCentavos, formatFechaCorta } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { PrecioEmpleado as PrecioEmpleadoTipo, Producto } from "../types"

/**
 * Precio de la lista de EMPLEADOS JDH, en la card, la ficha y las listas.
 *
 * Se decide por el DATO, no por la sesión: el API solo envía `precioEmpleado`
 * a un JWT de empleado, así que para anónimos y clientes el campo no existe y
 * esto no pinta nada — ni hueco, ni placeholder. Es la misma garantía que
 * `PriceContext`: no hay un `if` que olvidar.
 *
 * - `undefined` → no es empleado: nada.
 * - `null` → empleado, producto fuera de la lista: una línea discreta, nunca
 *   "$0".
 * - objeto → SOLO el precio final (`valorConIva`). El precio sin IVA y la
 *   tarifa no se muestran en el catálogo: la base y los impuestos aparecen
 *   únicamente al finalizar el pedido.
 */
export function PrecioEmpleado({
  producto,
  variante,
  className,
}: {
  producto: Pick<Producto, "precioEmpleado">
  /** `linea`: una sola línea, para filas de tabla (listas de pedido). */
  variante: "card" | "ficha" | "linea"
  className?: string
}) {
  const precio = producto.precioEmpleado
  if (precio === undefined) return null

  if (precio === null) {
    return (
      <p
        className={cn(
          "text-muted-foreground",
          variante === "ficha" ? "text-sm" : "text-xs",
          className
        )}
      >
        Sin precio de empleado
      </p>
    )
  }

  if (variante === "linea") {
    return (
      <p
        className={cn("text-xs text-muted-foreground tabular-nums", className)}
      >
        <span className="font-semibold text-foreground">
          {formatCentavos(precio.valorConIva)}
        </span>{" "}
        · precio empleado
      </p>
    )
  }

  return variante === "card" ? (
    <PrecioCard precio={precio} className={className} />
  ) : (
    <PrecioFicha precio={precio} className={className} />
  )
}

/**
 * La unidad solo aporta si dice algo distinto de "una unidad": "por caja x 12"
 * informa, "por unidad" no. En la ficha se muestra siempre.
 */
const UNIDADES_OBVIAS = new Set(["UNIDAD", "UND", "UN", "UNID", "UNI"])

function unidadQueAporta(unidad: string | null): string | null {
  if (!unidad || UNIDADES_OBVIAS.has(unidad.trim().toUpperCase())) return null
  return unidad.trim().toLowerCase()
}

function PrecioCard({
  precio,
  className,
}: {
  precio: PrecioEmpleadoTipo
  className?: string
}) {
  const unidad = unidadQueAporta(precio.unidad)
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        Precio empleado
      </p>
      <p className="text-base font-bold tabular-nums">
        {formatCentavos(precio.valorConIva)}
      </p>
      {unidad ? (
        <p className="text-xs text-muted-foreground">por {unidad}</p>
      ) : null}
    </div>
  )
}

function PrecioFicha({
  precio,
  className,
}: {
  precio: PrecioEmpleadoTipo
  className?: string
}) {
  return (
    <section
      aria-label="Precio para empleados JDH"
      className={cn(
        "flex shrink-0 flex-col gap-2 rounded-lg border border-[var(--color-border-strong)] p-4",
        className
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
        Precio empleados JDH
      </p>
      <p className="text-3xl font-bold tracking-tight tabular-nums">
        {formatCentavos(precio.valorConIva)}
      </p>
      {precio.unidad ? (
        <p className="text-sm text-muted-foreground">
          por {precio.unidad.toLowerCase()}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Solo para personal JDH · costos del {formatFechaCorta(precio.fechaFoto)}
      </p>
    </section>
  )
}
