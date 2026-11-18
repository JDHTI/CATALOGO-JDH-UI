import { CircleCheck, Truck } from "lucide-react"

import { formatCentavos } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ENVIO_GRATIS_DESDE } from "../limites"

/**
 * Barra de avance hacia el envío gratuito a domicilio, encima del resumen.
 * Se mueve con cada cambio del carrito porque `subtotal` viene del carrito
 * que devuelve el API tras cada operación.
 */
export function EnvioGratisProgreso({
  subtotal,
  className,
}: {
  /** Subtotal del carrito en centavos (antes de impuestos). */
  subtotal: number
  className?: string
}) {
  const faltante = Math.max(0, ENVIO_GRATIS_DESDE - subtotal)
  const desbloqueado = faltante === 0
  const porcentaje = Math.min(100, (subtotal / ENVIO_GRATIS_DESDE) * 100)
  const Icono = desbloqueado ? CircleCheck : Truck

  return (
    <section
      aria-label="Envío gratuito a domicilio"
      className={cn(
        "flex flex-col gap-2.5 rounded-[var(--jdh-radius-md)] border border-[var(--color-border-strong)] p-4",
        className
      )}
    >
      <p className="flex items-start gap-2 text-sm font-semibold">
        <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {desbloqueado
          ? "¡Desbloqueaste el envío gratuito a tu domicilio!"
          : "Desbloquea envío gratuito a tu domicilio"}
      </p>
      <div
        role="progressbar"
        aria-label="Avance hacia el envío gratuito"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(porcentaje)}
        aria-valuetext={
          desbloqueado
            ? "Envío gratuito desbloqueado"
            : `Te faltan ${formatCentavos(faltante)}`
        }
        className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]"
      >
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {desbloqueado ? (
          <>
            Tu pedido alcanza el mínimo de {formatCentavos(ENVIO_GRATIS_DESDE)}.
          </>
        ) : (
          <>
            Te faltan{" "}
            <span className="font-semibold text-foreground">
              {formatCentavos(faltante)}
            </span>{" "}
            · envío gratis desde {formatCentavos(ENVIO_GRATIS_DESDE)}
          </>
        )}
      </p>
    </section>
  )
}
