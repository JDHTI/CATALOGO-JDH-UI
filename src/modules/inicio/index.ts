export { inicioModule } from "./inicio.module"
export { InicioView } from "./components/inicio-view"
export type { BannerSitio, ImagenSitio } from "./types"

// `server/queries.ts` NO se re-exporta aquí: importa `server-only` y este
// barrel llega a `config/modules.ts`, que sí viaja al bundle de cliente. Las
// rutas lo importan por deep path.
