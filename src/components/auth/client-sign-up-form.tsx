"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { Field } from "@/components/forms/field"
import { JdhInput } from "@/components/forms/jdh-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { registrarCliente, type ResultadoRegistro } from "@/lib/auth/acciones"

import { PasswordInput } from "./password-input"
import { PasswordStrength } from "./password-strength"
import {
  conBienvenida,
  DESTINO_TRAS_INGRESO,
  safeRedirectTo,
} from "./redirect-to"

type Errores = Extract<ResultadoRegistro, { ok: false }>["errores"]

/**
 * Alta de CUENTA DE CLIENTE (externo): nombre, correo y contraseña.
 *
 * Envía a la Server Action `registrarCliente` en vez de llamar a
 * `authClient.signUp` desde aquí. Better Auth solo sabe imponer el largo de la
 * contraseña; el resto de la política (composición, lista de bloqueo, no
 * derivarla del nombre o del correo) vive en `src/lib/auth/registro.ts`, y
 * pasando por la acción esa política se aplica EN EL SERVIDOR. Si el
 * formulario llamara al endpoint directamente, un `fetch` a mano se saltaría
 * todo salvo el mínimo de caracteres.
 *
 * La cuenta nace sin `clienteId`: ve exactamente los mismos precios que un
 * visitante anónimo hasta que administración la vincule al ERP. Ver la nota de
 * `emailAndPassword` en `src/lib/auth/server.ts`.
 *
 * Tras el alta se navega con `window.location`, no con `router.push`: la
 * sesión la creó el servidor dentro de la acción, y el store de sesión que
 * alimenta `useSession` en el cliente no se entera de eso —seguiría
 * respondiendo "sin sesión" y la bienvenida saldría sin nombre—. Una
 * navegación completa monta el árbol con la cookie ya puesta. Ocurre una vez
 * por registro y cae justo donde la cortina de bienvenida cubre la pantalla.
 */
export function ClientSignUpForm({
  redirectTo,
}: {
  redirectTo: string | null
}) {
  const [pendiente, startTransition] = React.useTransition()
  const [mensaje, setMensaje] = React.useState<string | null>(null)
  const [errores, setErrores] = React.useState<Errores>(undefined)
  const [contrasena, setContrasena] = React.useState("")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const datos = {
      nombre: String(form.get("nombre") ?? ""),
      email: String(form.get("email") ?? ""),
      contrasena: String(form.get("contrasena") ?? ""),
      confirmacion: String(form.get("confirmacion") ?? ""),
    }

    setMensaje(null)
    setErrores(undefined)

    startTransition(async () => {
      const resultado = await registrarCliente(datos)

      if (!resultado.ok) {
        setMensaje(resultado.mensaje)
        setErrores(resultado.errores)
        return
      }

      window.location.assign(
        conBienvenida(safeRedirectTo(redirectTo, DESTINO_TRAS_INGRESO))
      )
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {mensaje ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{mensaje}</AlertDescription>
        </Alert>
      ) : null}

      <Field label="Nombre completo" required error={errores?.nombre}>
        <JdhInput
          name="nombre"
          autoComplete="name"
          required
          placeholder="María Restrepo"
        />
      </Field>

      <Field label="Correo electrónico" required error={errores?.email}>
        <JdhInput
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="compras@tuempresa.com"
        />
      </Field>

      <Field label="Contraseña" required error={errores?.contrasena}>
        <PasswordInput
          name="contrasena"
          autoComplete="new-password"
          required
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
        />
      </Field>
      <PasswordStrength value={contrasena} />

      <Field
        label="Confirmar contraseña"
        required
        error={errores?.confirmacion}
      >
        <PasswordInput
          name="confirmacion"
          autoComplete="new-password"
          required
        />
      </Field>

      <JdhButton type="submit" size="lg" loading={pendiente} className="w-full">
        Crear cuenta
      </JdhButton>

      <p className="text-xs text-muted-foreground">
        Al crear la cuenta verás el catálogo con los precios de lista pública.
        Para los precios de tu negociación, tu asesor comercial debe vincularla
        con tu código de cliente.
      </p>
    </form>
  )
}
