import { CatalogoPage } from "@/components/layout/catalogo-page"
import { DetalleSkeleton } from "@/modules/catalogo/components/producto-detalle-view"

export default function Loading() {
  return (
    // `compacta` igual que la página: si el esqueleto creciera con su
    // contenido, la barra de scroll aparecería y desaparecería al hidratar.
    <CatalogoPage compacta>
      <DetalleSkeleton />
    </CatalogoPage>
  )
}
