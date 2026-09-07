import { JdhButton } from "@/components/common/jdh-button"
import { GoogleLogo } from "@/components/icons/google-logo"
import { MicrosoftLogo } from "@/components/icons/microsoft-logo"

/**
 * Registro con proveedores externos (Google y cuentas PERSONALES de
 * Microsoft), para clientes que no están en el tenant de JDH.
 *
 * SOLO MAQUETA. No hay `onClick` ni proveedor configurado detrás: ninguno de
 * los dos existe todavía en `socialProviders` (`src/lib/auth/server.ts`) y el
 * `microsoft` que sí existe apunta al tenant de JDH con validación estricta
 * (`assertJdhTenant`), así que reutilizarlo aquí rechazaría exactamente a la
 * audiencia que este bloque dice atender.
 *
 * Están `disabled` de verdad, no maquillados: un botón que parece funcionar y
 * no hace nada al pulsarlo es peor que uno que se anuncia como pendiente. El
 * pie de texto dice por qué, para que el estado no se comunique solo por la
 * opacidad (DESIGN.md: nunca solo color/forma, siempre texto).
 *
 * Al conectarlos: crear el proveedor en `socialProviders`, cambiar cada botón
 * por `authClient.signIn.social({ provider, callbackURL: conBienvenida(...) })`
 * —el mismo patrón de `StaffSignInButton`— y borrar el pie.
 */
export function ExternalOAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <JdhButton variant="secondary" size="lg" disabled className="w-full">
        <GoogleLogo className="size-4" />
        Continuar con Google
      </JdhButton>

      <JdhButton variant="secondary" size="lg" disabled className="w-full">
        <MicrosoftLogo className="size-4" />
        Continuar con Microsoft
      </JdhButton>

      <p className="text-xs text-muted-foreground">
        El registro con Google y con cuentas personales de Microsoft estará
        disponible pronto. Por ahora, crea tu cuenta con correo y contraseña.
      </p>
    </div>
  )
}
