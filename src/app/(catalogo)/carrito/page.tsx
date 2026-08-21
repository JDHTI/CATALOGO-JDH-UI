import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { PERMISSIONS } from "@/config/permissions"
import { requirePermissions } from "@/lib/auth"
import { CarritoView } from "@/modules/carrito"

export const metadata: Metadata = { title: "Carrito de compras" }

export default async function CarritoPage() {
  await requirePermissions([PERMISSIONS.carrito.read])
  return (
    <CatalogoPage>
      <CarritoView />
    </CatalogoPage>
  )
}
