"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { JdhInput } from "@/components/forms/jdh-input"
import { cn } from "@/lib/utils"

/**
 * Campo de contraseña con conmutador de visibilidad.
 *
 * Poder leer lo que se escribe reduce los errores de tecleo —y por tanto los
 * intentos fallidos, que aquí cuestan un bloqueo por límite de peticiones— y
 * es especialmente necesario en el registro, donde la política exige mayúscula
 * y número y la confirmación tiene que coincidir.
 *
 * El conmutador es un `<button>` real dentro del campo, no un icono
 * decorativo: se alcanza con teclado y anuncia su estado con `aria-pressed`.
 * `tabIndex={-1}` lo saca del recorrido de tabulación para que Tab desde la
 * contraseña vaya al siguiente campo del formulario y no al ojo; sigue siendo
 * accesible con navegación por elementos de un lector de pantalla.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <JdhInput
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icono className="size-4" />
      </button>
    </div>
  )
}
