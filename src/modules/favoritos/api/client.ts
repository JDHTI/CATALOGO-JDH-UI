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
 * El API todavía puede no publicar favoritos (404). No es un error a mostrar:
 * la UI esconde corazones y contador y el resto del catálogo sigue igual, el
 * mismo criterio que `orderBy` y `/destacados` en el catálogo.
 */
export class FavoritosNoDisponiblesError extends Error {}

async function pedir(path: `/${string}`, init?: RequestInit) {
  const respuesta = await fetch(`/api/favoritos${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  })

  if (respuesta.status === 401) throw new NoAutenticadoError()
  if (respuesta.status === 404 || respuesta.status === 501) {
    throw new FavoritosNoDisponiblesError()
  }
  if (!respuesta.ok) {
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
  const respuesta = await pedir("/ids", { signal })
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

  const respuesta = await pedir(`/${sufijo}`, { signal })
  return aPaginaProductos(
    paginaProductosDtoSchema.parse(await respuesta.json())
  )
}

/** Alta idempotente: repetirla no falla, para que el toggle no se rompa. */
export async function agregarFavorito(productoId: string): Promise<void> {
  await pedir(`/${encodeURIComponent(productoId)}`, { method: "PUT" })
}

/** Baja idempotente: quitar algo que ya no está tampoco falla. */
export async function quitarFavorito(productoId: string): Promise<void> {
  await pedir(`/${encodeURIComponent(productoId)}`, { method: "DELETE" })
}
