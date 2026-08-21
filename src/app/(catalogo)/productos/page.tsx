import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { CatalogoView } from "@/modules/catalogo"

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Explora el portafolio JDH por categoría, marca o código de producto.",
}

/**
 * Vacía a propósito mientras se rediseña el listado (ver `CatalogoView`):
 * sin grid, sin llamadas a `getPriceContext()`/`listarProductos()` — esas
 * volverán cuando exista la vista real.
 */
export default function ProductosPage() {
  return (
    <CatalogoPage>
      <CatalogoView />
    </CatalogoPage>
  )
}
