import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { requireEmpleado } from "@/lib/auth"
import { PedidoConfirmacionView } from "@/modules/carrito"

export const metadata: Metadata = {
  title: "Pedido registrado",
  robots: { index: false, follow: false },
}

/** Confirmación de un pedido de empleado. El API solo devuelve los propios. */
export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireEmpleado()
  const { id } = await params
  return (
    <CatalogoPage>
      <PedidoConfirmacionView id={id} />
    </CatalogoPage>
  )
}
