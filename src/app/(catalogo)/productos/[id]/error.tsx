"use client"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { ProductoDetalleEstado } from "@/modules/catalogo/components/producto-detalle-estado"

export default function Error({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <CatalogoPage>
      <ProductoDetalleEstado onRetry={retry} />
    </CatalogoPage>
  )
}
