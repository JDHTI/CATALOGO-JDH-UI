import { CatalogoPage } from "@/components/layout/catalogo-page"
import { DetalleSkeleton } from "@/modules/catalogo/components/producto-detalle-view"

export default function Loading() {
  return (
    <CatalogoPage>
      <DetalleSkeleton />
    </CatalogoPage>
  )
}
