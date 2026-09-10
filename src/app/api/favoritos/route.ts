import type { NextRequest } from "next/server"

import { haciaElApi } from "./_backend"

/**
 * `GET /api/favoritos` — página de favoritos del usuario, con el producto
 * completo. Transporta `page`/`limit` tal cual: la semántica de paginación
 * la decide el API, igual que en el listado del catálogo.
 */
export async function GET(request: NextRequest) {
  const entrada = request.nextUrl.searchParams
  const salida = new URLSearchParams()
  for (const clave of ["page", "limit"]) {
    const valor = entrada.get(clave)
    if (valor) salida.set(clave, valor)
  }
  const query = salida.toString()
  return haciaElApi(`/favorites${query ? `?${query}` : ""}`)
}
