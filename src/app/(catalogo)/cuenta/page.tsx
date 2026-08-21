import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { PERMISSIONS } from "@/config/permissions"
import { requirePermissions } from "@/lib/auth"
import { CuentaView } from "@/modules/cuenta"

export const metadata: Metadata = { title: "Mi cuenta" }

export default async function CuentaPage() {
  await requirePermissions([PERMISSIONS.cuenta.read])
  return (
    <CatalogoPage>
      <CuentaView />
    </CatalogoPage>
  )
}
