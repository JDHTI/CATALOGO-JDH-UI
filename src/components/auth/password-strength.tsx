"use client"

import {
  ETIQUETAS_FUERZA,
  fuerzaContrasena,
  type NivelFuerza,
} from "@/lib/auth/registro"
import { cn } from "@/lib/utils"

const NIVELES: NivelFuerza[] = [1, 2, 3, 4]

/**
 * Medidor de fuerza de la contraseña: cuatro segmentos y una etiqueta.
 *
 * Monocromo a propósito. El semáforo rojo/ámbar/verde es el patrón habitual y
 * está descartado por DESIGN.md §2 (sin hues fuera del logo) y por §"nunca
 * comunicar estado solo con color": aquí el nivel se lee por cuántos
 * segmentos están llenos Y por la etiqueta escrita al lado, que es lo que
 * anuncia también un lector de pantalla.
 *
 * `aria-live="polite"`: el nivel cambia mientras se escribe, y sin esto el
 * único que se entera del progreso es quien lo ve. `polite` y no `assertive`
 * para no interrumpir el tecleo en cada pulsación.
 */
export function PasswordStrength({ value }: { value: string }) {
  const nivel = fuerzaContrasena(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1" aria-hidden>
        {NIVELES.map((n) => (
          <span
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-150",
              value && nivel >= n ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {value ? (
          <>
            Seguridad:{" "}
            <span className="font-medium text-foreground">
              {ETIQUETAS_FUERZA[nivel]}
            </span>
          </>
        ) : (
          "Mínimo 10 caracteres, con mayúscula, minúscula y número."
        )}
      </p>
    </div>
  )
}
