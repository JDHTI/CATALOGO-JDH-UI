import { formatCentavos } from "@/lib/format"

/**
 * Subtotal, impuestos y total. UN solo renglón de impuestos, sin desglose por
 * tarifa: es lo que entrega el API y lo que se pidió mostrar.
 */
export function TotalesPedido({
  subtotal,
  impuestos,
  total,
}: {
  subtotal: number
  impuestos: number
  total: number
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatCentavos(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Impuestos</dt>
        <dd className="tabular-nums">{formatCentavos(impuestos)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-[var(--color-border)] pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="text-2xl font-bold tabular-nums">
          {formatCentavos(total)}
        </dd>
      </div>
    </dl>
  )
}
