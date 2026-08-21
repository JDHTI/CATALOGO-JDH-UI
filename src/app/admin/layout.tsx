import type { Metadata } from "next"
import Link from "next/link"

import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { PERMISSIONS } from "@/config/permissions"
import { requirePermissions } from "@/lib/auth"

export const metadata: Metadata = {
  title: {
    default: "Panel de administración",
    template: "%s · Admin · JDH",
  },
}

/**
 * Shell del panel de administración — el tercer frente. Vive en el mismo
 * dominio (`/admin/*`) pero es una superficie completamente aparte del
 * catálogo: su propia sidebar, su propia audiencia (personal JDH vía Entra ID).
 *
 * `proxy.ts` ya devuelve 404 a no-admins de forma optimista; este es el
 * chequeo autoritativo (el que realmente importa).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissions([PERMISSIONS.admin.access])

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center border-b bg-background px-6">
          <Link
            href="/productos"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Volver al catálogo
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1800px] flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
