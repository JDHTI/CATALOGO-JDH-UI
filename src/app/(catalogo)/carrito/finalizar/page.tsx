import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { requireEmpleado } from "@/lib/auth"
import { FinalizarPedidoView } from "@/modules/carrito"

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false, follow: false },
}

export default async function FinalizarPedidoPage() {
  await requireEmpleado()
  return (
    <CatalogoPage>
      <FinalizarPedidoView />
    </CatalogoPage>
  )
}
