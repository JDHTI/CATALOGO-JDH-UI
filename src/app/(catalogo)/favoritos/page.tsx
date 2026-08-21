import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { PERMISSIONS } from "@/config/permissions"
import { requirePermissions } from "@/lib/auth"
import { FavoritosView } from "@/modules/favoritos"

export const metadata: Metadata = { title: "Favoritos" }

export default async function FavoritosPage() {
  await requirePermissions([PERMISSIONS.favoritos.read])
  return (
    <CatalogoPage>
      <FavoritosView />
    </CatalogoPage>
  )
}
