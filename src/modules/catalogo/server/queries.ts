import "server-only"

import { cache } from "react"

import { obtenerProducto } from "../api/client"
import { CatalogoApiError } from "../api/errors"

/** Una lectura pública por request, compartida por página y metadatos. */
export const obtenerProductoPublico = cache(async (id: string) => {
  try {
    return await obtenerProducto(id, AbortSignal.timeout(10_000))
  } catch (error) {
    if (error instanceof CatalogoApiError && error.statusCode === 404) {
      return null
    }
    throw error
  }
})
