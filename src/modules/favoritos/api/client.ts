import {
  aPaginaProductos,
  paginaProductosDtoSchema,
  type Paginado,
  type Producto,
} from "@/modules/catalogo"

import { favoritosIdsDtoSchema } from "../schemas/api"

/**
 * Cliente de favoritos: habla con los route handlers de ESTA app
 * (`/api/favoritos/*`), no con el API del catálogo.
 *
 * La diferencia importa. Las lecturas del catálogo son públicas y el
 * navegador las pide directo al API; favoritos es por usuario, así que la
 * llamada al API va firmada con un JWT de vida corta que NO debe llegar al
 * navegador. El route handler corre en servidor, es quien tiene el token, y
 * hacia el cliente la autoridad sigue siendo la cookie de sesión.
 *
 * Por eso aquí no hay `Authorization` ni base URL configurable: son rutas
 * del mismo origen y la cookie viaja sola.
 */

/** Se distingue del resto de fallos porque la UI reacciona distinto. */
export class NoAutenticadoError extends Error {}

/**
 * El API todavía no publica favoritos. No es un error a mostrar: la UI
 * esconde corazones y contador y el resto del catálogo sigue igual, el mismo
 * criterio que `orderBy` y `/destacados`.
 */
export class FavoritosNoDisponiblesError extends Error {}

/** El producto no existe o el sync lo desactivó. */
export class ProductoNoDisponibleError extends Error {}

/**
 * El 404 es AMBIGUO en este contrato y hay que desambiguarlo por endpoint:
 * en las lecturas significa «la ruta no existe todavía» (degradar en
 * silencio), y en las escrituras «ese producto no existe o está inactivo»
 * (un fallo real y puntual). Tratarlos igual escondería toda la
 * funcionalidad porque el usuario marcó un producto que acababan de dar de
 * baja.
 */
async function pedir(
  path: `/${string}`,
  init: RequestInit | undefined,
  esLectura: boolean
) {
  const respuesta = await fetch(`/api/favoritos${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  })

  if (respuesta.status === 401) throw new NoAutenticadoError()
  // 501 lo pone nuestro propio route handler cuando falta `BACKEND_API_URL`.
  if (respuesta.status === 501) throw new FavoritosNoDisponiblesError()
  if (respuesta.status === 404) {
    throw esLectura
      ? new FavoritosNoDisponiblesError()
      : new ProductoNoDisponibleError()
  }
  if (!respuesta.ok) {
    // El API responde 503 si no alcanza nuestro JWKS. Es un fallo temporal de
    // infraestructura, NO de credenciales: por eso no se convierte en
    // `NoAutenticadoError`, que provocaría cierres de sesión en cascada.
    throw new Error(`Favoritos respondió ${respuesta.status}`)
  }
  return respuesta
}

/**
 * Ids de TODOS los favoritos del usuario, más el total.
 *
 * Una sola petición resuelve dos cosas que si no serían muchas: el contador
 * del header y qué corazones van marcados en el grid del catálogo. La
 * alternativa —preguntar por cada card visible— eran 12 peticiones por página
 * y otra para el conteo.
 */
export async function obtenerFavoritosIds(
  signal?: AbortSignal
): Promise<{ ids: string[]; total: number }> {
  const respuesta = await pedir("/ids", { signal }, true)
  return favoritosIdsDtoSchema.parse(await respuesta.json())
}

/** Página de favoritos con el producto completo, para la vista dedicada. */
export async function listarFavoritos(
  params: { page?: number; limit?: number } = {},
  signal?: AbortSignal
): Promise<Paginado<Producto>> {
  const query = new URLSearchParams()
  if (params.page) query.set("page", String(params.page))
  if (params.limit) query.set("limit", String(params.limit))
  const sufijo = query.toString() ? `?${query}` : ""

  const respuesta = await pedir(`/${sufijo}`, { signal }, true)
  return aPaginaProductos(
    paginaProductosDtoSchema.parse(await respuesta.json())
  )
}

/**
 * Alta y baja. Idempotentes por contrato, así que repetirlas no falla y el
 * toggle aguanta un doble clic o un reintento.
 *
 * El API responde el ESTADO FINAL (`{ productId, favorito }`) en vez de 204,
 * para que la reconciliación no tenga que adivinar si fue esta petición la
 * que aplicó el cambio. Aquí no se usa —la caché ya se invalida al terminar—
 * pero por eso no se asume cuerpo vacío.
 */
export async function agregarFavorito(productoId: string): Promise<void> {
  await pedir(`/${encodeURIComponent(productoId)}`, { method: "PUT" }, false)
}

export async function quitarFavorito(productoId: string): Promise<void> {
  await pedir(`/${encodeURIComponent(productoId)}`, { method: "DELETE" }, false)
}
