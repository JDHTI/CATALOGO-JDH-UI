import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { PERMISSIONS } from "@/config/permissions"
import { requirePermissions } from "@/lib/auth"
import { ListasView } from "@/modules/listas"

export const metadata: Metadata = { title: "Mis listas" }

/**
 * Ruta privada dentro del shell público: comparte header/nav/footer con el
 * catálogo, pero exige sesión. `proxy.ts` ya redirige a `/ingreso` de forma
 * optimista; este es el chequeo autoritativo.
 */
export default async function ListasPage() {
  await requirePermissions([PERMISSIONS.listas.read])
  return (
    <CatalogoPage>
      <ListasView />
    </CatalogoPage>
  )
}
