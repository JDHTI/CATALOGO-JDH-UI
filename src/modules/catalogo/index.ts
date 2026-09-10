export { catalogoModule } from "./catalogo.module"
export { CatalogoView, CatalogoViewFallback } from "./components/catalogo-view"
export { ProductoDetalleView } from "./components/producto-detalle-view"

/* Superficie pública para OTROS módulos. Favoritos guarda productos del
 * catálogo, así que reusa su tipo, su card y el schema de página en vez de
 * declarar una forma paralela que se desincronizaría al primer cambio del
 * contrato. Se exporta por el barril, nunca importando rutas internas. */
export { ProductoCard, ProductoCardSkeleton } from "./components/producto-card"
export { paginaProductosDtoSchema, aPaginaProductos } from "./schemas/api"
export type { Producto, Paginado } from "./types"
