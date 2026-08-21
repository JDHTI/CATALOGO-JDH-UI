import Link from "next/link"

import { AuthShowcase } from "@/components/auth/auth-showcase"
import { Logo } from "@/components/common/logo"

/**
 * Layout de las rutas de ingreso. Pantalla partida: el panel showcase (la
 * operación de JDH, en ink) ocupa 60% a la izquierda y la columna del
 * formulario 40% a la derecha. Sin chrome de app.
 *
 * Por debajo de `lg` la grilla colapsa a flujo de columna: el showcase queda
 * como banner corto arriba (fija su propia altura) y el formulario toma el
 * resto del viewport.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col lg:grid lg:grid-cols-[3fr_2fr]">
      <AuthShowcase />

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        {/* Logo y formulario comparten una columna `max-w-sm` para alinear su
            borde izquierdo con la tipografía del showcase. */}
        <div className="flex w-full max-w-sm flex-col gap-10">
          {/* Solo desde `lg`: más abajo el banner del showcase ya lleva el
              lockup, y dos logos en una pantalla es uno de más. */}
          <Link href="/productos" className="hidden self-start lg:block">
            <Logo variant="lockup" tone="auto" height={40} priority />
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
