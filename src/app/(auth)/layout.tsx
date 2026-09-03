import Link from "next/link"

import { AuthShowcase } from "@/components/auth/auth-showcase"
import { Logo } from "@/components/common/logo"

/**
 * Layout de las rutas de ingreso. El panel fotográfico ocupa 60% a la
 * izquierda y la columna de credenciales 40% a la derecha. Sin chrome de app.
 *
 * Por debajo de `lg` la grilla colapsa a flujo de columna: el panel queda como
 * banda corta arriba (fija su propia altura) y el formulario toma el resto del
 * viewport.
 *
 * El lockup vive en la columna de credenciales en todos los anchos. En el
 * panel fotográfico, su posición anterior la ocupa la salida al catálogo.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col lg:grid lg:grid-cols-[3fr_2fr]">
      <AuthShowcase />

      <div className="flex flex-1 flex-col bg-background px-6 py-6">
        <div className="mx-auto flex w-full max-w-sm">
          <Link
            href="/"
            aria-label="Ir al catálogo de Juan D. Hoyos Distribuciones"
            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <Logo variant="lockup" tone="auto" height={40} priority />
          </Link>
        </div>

        {/* El formulario se centra en el espacio que queda bajo el logo, no en
            la columna entera: así el conmutador ingresar/registrarse no se
            mueve verticalmente al cambiar de pestaña. */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
