import { PackageOpen } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Estado vacío de una sección de la homepage.
 *
 * Las secciones que dependen del catálogo (proveedores, muestra de
 * productos, marcas) NO se ocultan cuando el API no devuelve datos: la
 * homepage perdería su cuerpo y se leería como una página rota. Conservan su
 * encabezado y muestran esto, que distingue los dos casos honestamente —
 * "todavía no hay datos publicados" no es lo mismo que "no pudimos cargar".
 *
 * Ocupa deliberadamente una altura parecida a la grilla que sustituye
 * (`min-h`): el layout de la homepage reserva mucho espacio entre secciones
 * porque está pensado para grillas de diez o más items, y un aviso de dos
 * líneas flotando en ese hueco hace que la página parezca averiada en vez de
 * vacía.
 *
 * `onInk` lo pinta sobre la franja negra (`ProviderMarquee`).
 */
export function SectionEmpty({
  mensaje,
  onInk = false,
}: {
  mensaje: string
  onInk?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-h-[13rem] flex-col items-center justify-center gap-3 rounded-[var(--jdh-radius-md)] border border-dashed px-6 py-12 text-center",
        onInk
          ? "border-[var(--color-ink-border)] bg-[var(--overlay-on-dark-04)] text-[var(--color-on-ink-muted)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-muted-foreground"
      )}
    >
      <PackageOpen
        className={cn("size-8", onInk ? "opacity-60" : "opacity-50")}
        strokeWidth={1.25}
        aria-hidden="true"
      />
      <p className="max-w-md text-sm">{mensaje}</p>
    </div>
  )
}

/**
 * Copy compartido: mismo mensaje para el mismo caso en toda la homepage.
 * `sinDatos` recibe la frase completa ya concordada — "marcas publicadas",
 * no "marcas" + un participio fijo que quedaría en masculino.
 */
export const SECTION_EMPTY_COPY = {
  /** El API respondió, pero todavía no hay registros publicados. */
  sinDatos: (queNoHay: string) =>
    `Aún no hay ${queNoHay} en el catálogo. Esta sección se llena sola cuando el portafolio esté cargado.`,
  /** El API no respondió: no se promete nada que no se sepa. */
  error: "No pudimos cargar esta sección en este momento.",
} as const
