import { createRegistry } from "@/lib/modules"

import { carritoModule } from "@/modules/carrito"
import { catalogoModule } from "@/modules/catalogo"
import { cuentaModule } from "@/modules/cuenta"
import { favoritosModule } from "@/modules/favoritos"
import { inicioModule } from "@/modules/inicio"
import { listasModule } from "@/modules/listas"
import { promocionesModule } from "@/modules/promociones"

/**
 * El registro de módulos — el único lugar donde se registra cada módulo.
 *
 * Para agregar uno:
 *   1. Crear `src/modules/<id>/` (ver `src/modules/README.md` para la anatomía).
 *   2. Exportar su manifiesto desde el `index.ts` de ese módulo.
 *   3. Agregar un import + una línea al array de abajo.
 *
 * Navegación, mega menú y chequeos de acceso se derivan de esta lista, así que
 * ese es todo el costo de cablear un módulo nuevo.
 *
 * El panel de administración NO se registra aquí: es otra superficie, con su
 * propia navegación en `src/modules/admin/admin-nav.ts`.
 */
export const modules = createRegistry([
  inicioModule,
  catalogoModule,
  listasModule,
  cuentaModule,
  favoritosModule,
  carritoModule,
  promocionesModule,
])
