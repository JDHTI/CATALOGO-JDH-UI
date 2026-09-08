import { CatalogoPage } from "@/components/layout/catalogo-page"
import { ProductoDetalleEstado } from "@/modules/catalogo/components/producto-detalle-estado"

export default function NotFound() {
  return (
    <CatalogoPage>
      <ProductoDetalleEstado noEncontrado />
    </CatalogoPage>
  )
}
