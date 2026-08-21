import { ModulePlaceholder } from "@/components/common/module-placeholder"

import { catalogoModule } from "../catalogo.module"

/**
 * Vacío a propósito: la implementación anterior (grid de productos, precios
 * resueltos por audiencia) se retiró mientras se rediseña de cara al nuevo
 * header. `src/lib/precios/` y `src/lib/format.ts` siguen intactos — no son
 * "componentes de producto", son la capa de precios que esta vista volverá a
 * usar cuando se reconstruya.
 */
export function CatalogoView() {
  return <ModulePlaceholder module={catalogoModule} />
}
