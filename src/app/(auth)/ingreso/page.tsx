import { AlertCircle } from "lucide-react"

import {
  AuthModeSwitcher,
  parseModo,
} from "@/components/auth/auth-mode-switcher"
import { ClientSignInForm } from "@/components/auth/client-sign-in-form"
import { ClientSignUpForm } from "@/components/auth/client-sign-up-form"
import { ExternalOAuthButtons } from "@/components/auth/external-oauth-buttons"
import { StaffSignInButton } from "@/components/auth/staff-sign-in-button"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { siteConfig } from "@/config/site"

export const metadata = { title: "Ingresar" }

/** Divisor con la palabra "o" — el mismo en los dos modos. */
function Separador() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span className="text-xs tracking-[var(--ls-wide)] text-muted-foreground uppercase">
        o
      </span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}

/**
 * Pantalla única de acceso para las DOS audiencias con sesión: clientes
 * (email + contraseña, con registro propio) y personal JDH (Entra ID). Una
 * sola ruta en vez de dos porque el usuario no siempre sabe en qué categoría
 * cae, y dos URLs de login duplican el punto de entrada sin darle nada a nadie.
 *
 * El modo (ingresar / crear cuenta) llega por search param y esta página lo
 * resuelve en el servidor: cada modo renderiza su formulario y su bloque de
 * proveedores, y no hay estado de cliente para el conmutador. Ver
 * `AuthModeSwitcher`.
 *
 * El bloque de proveedores cambia con el modo a propósito. Al INGRESAR se
 * ofrece Entra ID, que es como entra el personal JDH. Al REGISTRARSE no: una
 * cuenta de JDH no se crea desde aquí, la aprovisiona el directorio; lo que
 * corresponde ahí son los proveedores externos (Google, Microsoft personal),
 * todavía sin conectar.
 *
 * `h2`, no `h1`: el `h1` de la pantalla es el nombre del sitio en el panel.
 */
export default async function IngresoPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string
    error?: string
    modo?: string
  }>
}) {
  const params = await searchParams
  const modo = parseModo(params.modo)
  const redirectTo = params.redirectTo ?? null
  const year = new Date().getFullYear()

  return (
    <Stagger staggerDelay={0.08} className="flex flex-col gap-8">
      <StaggerItem className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
          Acceso
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {modo === "registro" ? "Crear cuenta" : "Ingresar"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {modo === "registro"
            ? "Regístrate para guardar listas, favoritos y hacer seguimiento a tus pedidos."
            : "Accede con tu cuenta de cliente para ver los precios de tu lista."}
        </p>
      </StaggerItem>

      <StaggerItem>
        <AuthModeSwitcher modo={modo} redirectTo={redirectTo} />
      </StaggerItem>

      {params.error ? (
        <StaggerItem>
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              No fue posible iniciar sesión. Inténtalo de nuevo; si el problema
              continúa, contacta a tu asesor comercial.
            </AlertDescription>
          </Alert>
        </StaggerItem>
      ) : null}

      <StaggerItem>
        {modo === "registro" ? (
          <ClientSignUpForm redirectTo={redirectTo} />
        ) : (
          <ClientSignInForm redirectTo={redirectTo} />
        )}
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-4">
        <Separador />
        {modo === "registro" ? (
          <ExternalOAuthButtons />
        ) : (
          <StaffSignInButton redirectTo={redirectTo} />
        )}
      </StaggerItem>

      <StaggerItem className="border-t border-border pt-6">
        <p className="font-mono text-xs text-muted-foreground">
          © {year} {siteConfig.companyLegal} · {siteConfig.shortName}{" "}
          {siteConfig.version}
        </p>
      </StaggerItem>
    </Stagger>
  )
}
