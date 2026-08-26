import { Suspense } from "react"
import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { CatalogoView, CatalogoViewFallback } from "@/modules/catalogo"

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Explora el portafolio JDH por categoría, marca o código de producto.",
}

/**
 * Ruta delgada: el listado real vive en el módulo (`CatalogoView`, conectado
 * a jdh-catalogo-api). El Suspense es obligatorio: la vista lee
 * `useSearchParams` (q/proveedor/pagina en la URL) y sin límite el prerender
 * estático de la ruta falla en build.
 */
export default function ProductosPage() {
  return (
    <CatalogoPage>
      <Suspense fallback={<CatalogoViewFallback />}>
        <CatalogoView />
      </Suspense>
    </CatalogoPage>
  )
}
