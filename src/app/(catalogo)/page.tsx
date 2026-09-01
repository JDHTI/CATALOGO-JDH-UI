import type { Metadata } from "next"

import { InicioView } from "@/modules/inicio"
// Deep path a propósito: `server/queries.ts` importa `server-only` y el barrel
// del módulo lo llevaría a `config/modules.ts`, que sí viaja al cliente.
import { listarBanners, obtenerHero } from "@/modules/inicio/server/queries"

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Catálogo JDH: alimentos, bebidas y productos de limpieza con precios de lista pública y entrega en siete ciudades de Colombia.",
}

/**
 * Portada del catálogo — resuelve las imágenes editables del sitio (hero y
 * banners, de `site/*` en el bucket) y renderiza la vista del módulo `inicio`.
 *
 * Las dos resoluciones van en paralelo: son independientes y encadenarlas
 * sumaría sus latencias al primer byte. Comprueban contra el bucket qué
 * piezas están subidas, con `revalidate` de 5 minutos, así que la ruta sigue
 * siendo estática y se refresca sola — ver
 * `src/modules/inicio/server/queries.ts`.
 */
export default async function HomePage() {
  const [hero, banners] = await Promise.all([obtenerHero(), listarBanners()])

  return <InicioView hero={hero} banners={banners} />
}
