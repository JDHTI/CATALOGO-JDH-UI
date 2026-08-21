import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { ClientSignInForm } from "@/components/auth/client-sign-in-form"
import { StaffSignInButton } from "@/components/auth/staff-sign-in-button"
import { Stagger, StaggerItem } from "@/components/motion/stagger"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { siteConfig } from "@/config/site"

export const metadata = { title: "Ingresar" }

/**
 * Pantalla única de ingreso para las DOS audiencias con sesión: clientes
 * (email + contraseña) y personal JDH (Entra ID). Una sola ruta en vez de dos
 * porque el usuario no siempre sabe en qué categoría cae, y dos URLs de login
 * duplican el punto de entrada sin darle nada a nadie.
 *
 * `h2`, no `h1`: el titular del panel showcase es el único `h1` de la página.
 */
export default async function IngresoPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}) {
  const params = await searchParams
  const year = new Date().getFullYear()

  return (
    <Stagger staggerDelay={0.08} className="flex flex-col gap-8">
      <StaggerItem className="flex flex-col gap-2">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
          Acceso
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Ingresar
        </h2>
        <p className="text-sm text-muted-foreground">
          Accede con tu cuenta de cliente para ver los precios de tu lista.
        </p>
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
        <ClientSignInForm redirectTo={params.redirectTo ?? null} />
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-border" />
          <span className="text-xs tracking-[var(--ls-wide)] text-muted-foreground uppercase">
            o
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>
        <StaffSignInButton redirectTo={params.redirectTo ?? null} />
      </StaggerItem>

      <StaggerItem className="flex flex-col gap-4 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          ¿Aún no tienes cuenta? Las cuentas de cliente las habilita tu asesor
          comercial.{" "}
          <Link
            href="/productos"
            className="underline decoration-1 underline-offset-2 hover:decoration-2"
          >
            Explora el catálogo público
          </Link>{" "}
          mientras tanto.
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          © {year} {siteConfig.companyLegal} · {siteConfig.shortName}{" "}
          {siteConfig.version}
        </p>
      </StaggerItem>
    </Stagger>
  )
}
