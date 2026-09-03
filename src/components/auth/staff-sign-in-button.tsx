"use client"

import * as React from "react"

import { JdhButton } from "@/components/common/jdh-button"
import { MicrosoftLogo } from "@/components/icons/microsoft-logo"
import { authClient } from "@/lib/auth/client"

import {
  conBienvenida,
  DESTINO_TRAS_INGRESO,
  safeRedirectTo,
} from "./redirect-to"

/**
 * Ingreso de PERSONAL JDH (asesores y administradores) vía Entra ID. Variante
 * secundaria a propósito: el CTA primario de esta pantalla es el formulario de
 * clientes, que es su audiencia mayoritaria (DESIGN.md §4.3 — un solo botón
 * primario por bloque de decisión).
 *
 * `callbackURL` apunta al catálogo y no a `/admin`: administración es una
 * herramienta a la que se entra a propósito (desde el menú de perfil), no el
 * lugar donde tiene sentido dejar a alguien que solo dijo "soy de JDH". Va
 * marcado con `conBienvenida` porque este flujo SALE del navegador hacia
 * Microsoft y vuelve por una redirección: el aviso tiene que viajar en la URL,
 * que es lo único que sobrevive al viaje.
 *
 * El estado de carga se queda en `true` hasta que la pestaña navega: la
 * llamada resuelve con la URL de autorización y el navegador se va, así que no
 * hay ningún punto donde apagarlo que no sea un parpadeo.
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
        const { error } = await authClient.signIn.social({
          provider: "microsoft",
          callbackURL: conBienvenida(
            safeRedirectTo(redirectTo, DESTINO_TRAS_INGRESO)
          ),
          errorCallbackURL: "/ingreso?error=1",
        })
        // Si ni siquiera se llegó a la redirección (red caída, proveedor mal
        // configurado) no hay navegación que apague el spinner.
        if (error) setLoading(false)
      }}
    >
      <MicrosoftLogo className="size-4" />
      Soy personal JDH
    </JdhButton>
  )
}
