import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { ProductoDetalleView } from "@/modules/catalogo"

export const metadata: Metadata = {
  title: "Detalle de producto",
  description: "Ficha del producto en el catálogo JDH.",
}

/**
 * Ruta delgada: la data la resuelve el módulo en cliente (useProducto) —
 * el nombre real del producto se conoce ahí, por eso el título es genérico.
 */
export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <CatalogoPage>
      <ProductoDetalleView id={id} />
    </CatalogoPage>
  )
}
