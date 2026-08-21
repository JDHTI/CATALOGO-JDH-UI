"use client"

import * as React from "react"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

import { JdhButton } from "@/components/common/jdh-button"
import { Field } from "@/components/forms/field"
import { JdhInput } from "@/components/forms/jdh-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authClient } from "@/lib/auth/client"

import { safeRedirectTo } from "./redirect-to"

/**
 * Ingreso de CLIENTES (cuentas externas): email + contraseña contra Better
 * Auth. El personal JDH entra por Entra ID (`StaffSignInButton`) — son dos
 * proveedores distintos porque los clientes no están en el tenant.
 *
 * Sin enlace de registro: `emailAndPassword.disableSignUp` está activo y las
 * cuentas se crean desde el panel de administración, que es lo único que puede
 * vincularlas al `clienteId` del ERP del que dependen los precios.
 *
 * El mensaje de error es deliberadamente genérico ("credenciales inválidas")
 * y no distingue "usuario no existe" de "contraseña incorrecta: eso sería un
 * oráculo de enumeración de cuentas.
 */
export function ClientSignInForm({
  redirectTo,
}: {
  redirectTo: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    setLoading(true)
    setError(null)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    })

    if (signInError) {
      setLoading(false)
      setError(
        "No pudimos validar esos datos. Revisa tu correo y contraseña e inténtalo de nuevo."
      )
      return
    }

    // `as Route`: con `typedRoutes` el destino se resuelve en runtime (viene
    // de un search param ya saneado), así que el tipado estático no puede
    // verificarlo. Mismo punto de fricción que los hrefs derivados del nav.
    router.push(safeRedirectTo(redirectTo, "/productos") as Route)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Field label="Correo electrónico" required>
        <JdhInput
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="compras@tuempresa.com"
        />
      </Field>

      <Field label="Contraseña" required>
        <JdhInput
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <JdhButton type="submit" size="lg" loading={loading} className="w-full">
        Ingresar
      </JdhButton>
    </form>
  )
}
