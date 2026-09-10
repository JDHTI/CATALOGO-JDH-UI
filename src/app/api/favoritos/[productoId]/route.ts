import { haciaElApi } from "../_backend"

/**
 * Alta y baja de un favorito. Las dos IDEMPOTENTES por contrato: la UI hace
 * toggle optimista, así que un doble clic o un reintento tras un fallo de red
 * no deben producir un error que el usuario no pueda entender ni resolver.
 *
 * `params` es una promesa: en Next 16 los parámetros de ruta son siempre
 * asíncronos, sin el shim síncrono de 15.
 */
type Contexto = { params: Promise<{ productoId: string }> }

export async function PUT(_request: Request, { params }: Contexto) {
  const { productoId } = await params
  return haciaElApi(`/favorites/${encodeURIComponent(productoId)}`, {
    method: "PUT",
  })
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { productoId } = await params
  return haciaElApi(`/favorites/${encodeURIComponent(productoId)}`, {
    method: "DELETE",
  })
}
