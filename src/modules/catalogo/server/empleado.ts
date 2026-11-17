import "server-only"

import { backendFetch } from "@/lib/api/backend-fetch"
import type { PriceContext } from "@/lib/precios"

import { aProducto, productoDtoSchema } from "../schemas/api"
import type { Producto } from "../types"
import { obtenerProductoPublico } from "./queries"

/**
 * Ficha de un producto para la audiencia del `PriceContext`.
 *
 * Vive aparte de `queries.ts` porque `backendFetch` arrastra la configuración
 * de Better Auth (`@/lib/auth/server`), y esas lecturas públicas no deben
 * depender de ella.
 *
 * Empleado → `GET /products/:id` con su JWT (claim `empleado`), que trae
 * `precioEmpleado`; `cache: "no-store"` porque la respuesta es personal. Si
 * el puente falla por algo que NO es del producto (sin token, API caído,
 * token rechazado) se cae a la lectura pública: el empleado ve la ficha sin
 * su precio en vez de una página de error. Un 404 sí es «no existe».
 *
 * Cualquier otra audiencia → la lectura pública de siempre.
 */
export async function obtenerProductoPara(
  id: string,
  contexto: PriceContext
): Promise<Producto | null> {
  if (contexto.audiencia !== "empleado") return obtenerProductoPublico(id)

  try {
    const respuesta = await backendFetch(
      `/products/${encodeURIComponent(id)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    )
    if (respuesta.status === 404) return null
    if (respuesta.ok) {
      return aProducto(productoDtoSchema.parse(await respuesta.json()))
    }
    console.warn(
      `[catalogo] /products/${id} como empleado respondió ${respuesta.status}; se sirve la ficha pública sin precio`
    )
  } catch (error) {
    console.warn(
      "[catalogo] No se pudo leer el producto como empleado; se sirve la ficha pública sin precio:",
      error
    )
  }
  return obtenerProductoPublico(id)
}
