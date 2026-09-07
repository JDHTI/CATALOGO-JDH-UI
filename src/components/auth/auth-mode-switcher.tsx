import type { Route } from "next"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type ModoAuth = "ingresar" | "registro"

/** Lee el modo del search param, con `ingresar` como valor por defecto. */
export function parseModo(valor: string | undefined): ModoAuth {
  return valor === "registro" ? "registro" : "ingresar"
}

/**
 * Conmutador entre ingresar y registrarse.
 *
 * Son dos ENLACES y no un estado de React a propósito. El modo vive en la URL
 * (`/ingreso?modo=registro`), así que se puede enlazar desde fuera, sobrevive
 * a una recarga y deja que la página siga siendo un Server Component que
 * decide qué formulario renderizar — sin JavaScript de por medio para algo que
 * es, literalmente, navegar. Por eso tampoco lleva `role="tablist"`: no son
 * pestañas de un widget, son dos direcciones, y el estado activo se anuncia
 * con `aria-current="page"`, que es lo que corresponde.
 *
 * `redirectTo` se propaga en ambos enlaces: quien llegó aquí desde una ruta
 * privada no puede perder su destino solo por mirar el formulario de registro.
 */
export function AuthModeSwitcher({
  modo,
  redirectTo,
}: {
  modo: ModoAuth
  redirectTo: string | null
}) {
  const sufijo = redirectTo
    ? `&redirectTo=${encodeURIComponent(redirectTo)}`
    : ""

  const opciones = [
    { id: "ingresar" as const, etiqueta: "Ingresar" },
    { id: "registro" as const, etiqueta: "Crear cuenta" },
  ]

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-[var(--color-bg-subtle)] p-1">
      {opciones.map((opcion) => {
        const activo = modo === opcion.id
        return (
          <Link
            key={opcion.id}
            href={`/ingreso?modo=${opcion.id}${sufijo}` as Route}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex h-9 items-center justify-center rounded-[calc(var(--radius)*0.8)] text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opcion.etiqueta}
          </Link>
        )
      })}
    </div>
  )
}
