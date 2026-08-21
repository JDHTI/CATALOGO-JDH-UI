"use client"

import * as React from "react"

import { JdhButton } from "@/components/common/jdh-button"
import { MicrosoftLogo } from "@/components/icons/microsoft-logo"
import { authClient } from "@/lib/auth/client"

import { safeRedirectTo } from "./redirect-to"

/**
 * Ingreso de PERSONAL JDH (asesores y administradores) vía Entra ID. Variante
 * secundaria a propósito: el CTA primario de esta pantalla es el formulario de
 * clientes, que es su audiencia mayoritaria (DESIGN.md §4.3 — un solo botón
 * primario por bloque de decisión).
 */
export function StaffSignInButton({
  redirectTo,
}: {
  redirectTo: string | null
}) {
  const [loading, setLoading] = React.useState(false)

  return (
    <JdhButton
      variant="secondary"
      size="lg"
      loading={loading}
      className="w-full"
      onClick={async () => {
        setLoading(true)
        await authClient.signIn.social({
          provider: "microsoft",
          callbackURL: safeRedirectTo(redirectTo, "/admin"),
          errorCallbackURL: "/ingreso?error=1",
        })
      }}
    >
      <MicrosoftLogo />
      Soy personal JDH
    </JdhButton>
  )
}
