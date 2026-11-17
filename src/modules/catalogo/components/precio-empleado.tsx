import { BadgeCheck } from "lucide-react"

import { formatCentavos, formatFechaCorta } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { PrecioEmpleado as PrecioEmpleadoTipo, Producto } from "../types"

/**
 * Precio de la lista de EMPLEADOS JDH, en la card y en la ficha.
 *
 * Se decide por el DATO, no por la sesión: el API solo envía `precioEmpleado`
 * a un JWT de empleado, así que para anónimos y clientes el campo no existe y
 * esto no pinta nada — ni hueco, ni placeholder. Es la misma garantía que
 * `PriceContext`: no hay un `if` que olvidar.
 *
 * - `undefined` → no es empleado: nada.
 * - `null` → empleado, producto fuera de la lista: una línea discreta, nunca
 *   "$0".
 * - objeto → precio con IVA destacado; debajo, en pequeño, el sin IVA y la
 *   `ivaEtiqueta` del API. Solo IVA: IBUA y consumo aún no vienen y no se
 *   inventan.
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
        · {sinCortes(precio.ivaEtiqueta)} · precio empleado
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
 * El precio lleva IVA encima del sin IVA. Comparación EXPLÍCITA contra null:
 * `ivaPct` 0 es «Sin IVA» (tarifa conocida, 0 %) y null es «IVA por
 * confirmar» (tarifa desconocida). Un `!ivaPct` los confundiría.
 */
function llevaIva(precio: PrecioEmpleadoTipo): boolean {
  return precio.ivaPct !== null && precio.ivaPct > 0
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

/**
 * "$ 49.863 sin IVA · IVA 19 %". Sin IVA encima (0 % o tarifa desconocida)
 * el sin IVA es el mismo número de arriba, así que solo va la etiqueta del
 * API: «Sin IVA» o «IVA por confirmar», tal cual.
 */
function detalleIva(precio: PrecioEmpleadoTipo): string {
  const etiqueta = sinCortes(precio.ivaEtiqueta)
  return llevaIva(precio)
    ? `${formatCentavos(precio.valor)} sin IVA · ${etiqueta}`
    : etiqueta
}

/**
 * «IVA 19 %» no debe partirse: en una card angosta el «%» quedaba solo en la
 * línea siguiente. Espacios no separables solo para pintar; el texto del API
 * no se toca.
 */
function sinCortes(texto: string): string {
  return texto.replace(/ /g, " ")
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
      <p className="text-xs text-muted-foreground tabular-nums">
        {detalleIva(precio)}
        {unidad ? ` · por ${unidad}` : null}
      </p>
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
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {formatCentavos(precio.valorConIva)}
        </p>
        {llevaIva(precio) ? (
          <p className="text-sm text-muted-foreground">IVA incluido</p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {detalleIva(precio)}
        {precio.unidad ? ` · por ${precio.unidad.toLowerCase()}` : null}
      </p>
      <p className="text-xs text-muted-foreground">
        Solo para personal JDH · costos del {formatFechaCorta(precio.fechaFoto)}
      </p>
    </section>
  )
}
