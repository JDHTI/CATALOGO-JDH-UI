import type { Metadata } from "next"

import { CatalogoPage } from "@/components/layout/catalogo-page"
import { PromocionesView } from "@/modules/promociones"

export const metadata: Metadata = {
  title: "Promociones",
  description: "Promociones vigentes del catálogo de JDH Distribuciones.",
}

export default function PromocionesPage() {
  return (
    <CatalogoPage>
      <PromocionesView />
    </CatalogoPage>
  )
}
